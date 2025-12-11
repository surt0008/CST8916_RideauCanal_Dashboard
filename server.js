/**
 * Rideau Canal Monitoring Dashboard - Backend Server
 * Serves the dashboard and provides API endpoints for real-time data
 */
 
// --- Crypto polyfill for Cosmos client (Node 18+ style) ---
const { webcrypto } = require("crypto");
if (!global.crypto) {
  global.crypto = webcrypto;
}
 
// --- Imports ---
const express = require("express");
const { CosmosClient } = require("@azure/cosmos");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
 
// --- App setup ---
const app = express();
const port = process.env.PORT || 3000;
 
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
 
// --- Cosmos DB setup ---
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});
 
const database = cosmosClient.database(process.env.COSMOS_DATABASE);
const container = database.container(process.env.COSMOS_CONTAINER);
 
// --- Location mapping (UI name <-> DB name) ---
const UI_LOCATIONS = ["Dow's Lake", "Fifth Avenue", "NAC"];
 
const UI_TO_DB_LOCATION = {
  "Dow's Lake": "DowsLake",
  "Fifth Avenue": "FifthAvenue",
  NAC: "NAC",
};
 
function getDbLocation(uiName) {
  return UI_TO_DB_LOCATION[uiName] || uiName;
}
 
// =====================================================
//  API: Latest readings for all locations
// =====================================================
app.get("/api/latest", async (req, res) => {
  try {
    const results = [];
 
    for (const uiLocation of UI_LOCATIONS) {
      const dbLocation = getDbLocation(uiLocation);
 
      const querySpec = {
        query:
          "SELECT * FROM c WHERE c.location = @location ORDER BY c.windowEndTime DESC",
        parameters: [{ name: "@location", value: dbLocation }],
      };
 
      const { resources } = await container.items.query(querySpec).fetchAll();
 
      console.log(
        `[latest] ${uiLocation} (DB: ${dbLocation}) -> ${resources.length} docs`
      );
 
      if (resources.length > 0) {
        const latest = resources[0];
 
        // Normalize so frontend always sees pretty UI names
        results.push({
          location: uiLocation,
          avgIceThickness: latest.avgIceThickness,
          avgSurfaceTemperature: latest.avgSurfaceTemperature,
          avgSnowAccumulation: latest.avgSnowAccumulation,
          safetyStatus: latest.safetyStatus,
          windowEndTime: latest.windowEndTime,
        });
      }
    }
 
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Error fetching latest data:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch latest data" });
  }
});
 
// =====================================================
//  API: Historical data for a specific location
// =====================================================
app.get("/api/history/:location", async (req, res) => {
  try {
    const uiLocation = decodeURIComponent(req.params.location);
    const dbLocation = getDbLocation(uiLocation);
    const limit = parseInt(req.query.limit) || 12;
 
    const querySpec = {
      query: `
        SELECT TOP @limit *
        FROM c
        WHERE c.location = @location
        ORDER BY c.windowEndTime DESC
      `,
      parameters: [
        { name: "@location", value: dbLocation },
        { name: "@limit", value: limit },
      ],
    };
 
    const { resources } = await container.items.query(querySpec).fetchAll();
 
    console.log(
      `[history] ${uiLocation} (DB: ${dbLocation}) -> ${resources.length} docs`
    );
 
    const sorted = resources
      .sort(
        (a, b) => new Date(a.windowEndTime) - new Date(b.windowEndTime)
      )
      .map((d) => ({
        ...d,
        location: uiLocation, // normalize again for frontend
      }));
 
    res.json({
      success: true,
      data: sorted,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch history" });
  }
});
 
// =====================================================
//  API: Overall system status
// =====================================================
app.get("/api/status", async (req, res) => {
  try {
    const statuses = [];
 
    for (const uiLocation of UI_LOCATIONS) {
      const dbLocation = getDbLocation(uiLocation);
 
      const querySpec = {
        query:
          "SELECT c.location, c.safetyStatus, c.windowEndTime FROM c WHERE c.location = @location",
        parameters: [{ name: "@location", value: dbLocation }],
      };
 
      const { resources } = await container.items.query(querySpec).fetchAll();
 
      console.log(
        `[status] ${uiLocation} (DB: ${dbLocation}) -> ${resources.length} docs`
      );
 
      if (resources.length > 0) {
        // Sort by windowEndTime DESC and pick latest
        resources.sort(
          (a, b) => new Date(b.windowEndTime) - new Date(a.windowEndTime)
        );
        const latest = resources[0];
        statuses.push({
          ...latest,
          location: uiLocation,
        });
      }
    }
 
    const overallStatus =
      statuses.length === 0
        ? "Unknown"
        : statuses.every((s) => s.safetyStatus === "Safe")
        ? "Safe"
        : statuses.some((s) => s.safetyStatus === "Unsafe")
        ? "Unsafe"
        : "Caution";
 
    res.json({
      success: true,
      overallStatus,
      locations: statuses,
    });
  } catch (error) {
    console.error("Error fetching status:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch system status" });
  }
});
 
// =====================================================
//  API: All data (debug)
// =====================================================
app.get("/api/all", async (req, res) => {
  try {
    const querySpec = {
      query: "SELECT * FROM c",
    };
 
    const { resources } = await container.items.query(querySpec).fetchAll();
 
    // Sort by newest first
    resources.sort(
      (a, b) => new Date(b.windowEndTime) - new Date(a.windowEndTime)
    );
 
    console.log(`[all] total docs: ${resources.length}`);
 
    res.json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error) {
    console.error("Error fetching all data:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch all data" });
  }
});
 
// =====================================================
//  Root & Health
// =====================================================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
 
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    cosmosdb: {
      endpoint: process.env.COSMOS_ENDPOINT ? "configured" : "missing",
      database: process.env.COSMOS_DATABASE,
      container: process.env.COSMOS_CONTAINER,
    },
  });
});
 
// =====================================================
//  Start server
// =====================================================
app.listen(port, () => {
  console.log(
    `🚀 Rideau Canal Dashboard server running on http://localhost:${port}`
  );
  console.log(
    `📊 API endpoints available at http://localhost:${port}/api (latest, history, status, all)`
  );
  console.log(`🏥 Health check: http://localhost:${port}/health`);
});
 
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down server...");
  process.exit(0);
});
 