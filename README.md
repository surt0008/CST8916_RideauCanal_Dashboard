# Rideau Canal Monitoring – Web Dashboard

## Overview

This repository contains the web-based analytics dashboard for the Rideau Canal Monitoring System. The dashboard visualizes real-time sensor data collected from three canal locations and processed through Azure IoT Hub and Stream Analytics. It displays live safety status, historical trends, environmental readings, and automatic refresh updates.

The dashboard exposes a backend API built with Node.js and Express, retrieves aggregation data from Azure Cosmos DB, and serves a responsive frontend interface showing charts and indicators. The dashboard can run locally or be deployed to Azure App Service.

---

## Dashboard Features

- **Live Data Display:** Automatically fetches updated data every few seconds.  
- **Safety Status Indicators:** Shows “Safe,” “Caution,” or “Unsafe” based on latest analytics.  
- **Historical Line Charts:** Visualizes ice thickness, surface temperature, and snow accumulation trends.  
- **Location-Based View:** Displays readings for Dow’s Lake, Fifth Avenue, and NAC.  
- **Auto-Refresh:** Frontend calls the backend API at set intervals for continuous updates.  
- **API-Driven Architecture:** Data pulled directly from Cosmos DB through structured endpoints.  
- **Deployed on Azure App Service:** Can run locally or in the cloud.  

---

## Technologies Used

- **Node.js** – Runtime environment  
- **Express.js** – Backend API framework  
- **Azure Cosmos DB** – Storage for aggregated data  
- **Azure App Service** – Hosting the dashboard  
- **HTML, CSS, JavaScript** – Frontend UI  
- **Chart.js** – Historical trend charts  
- **Axios** – Frontend API requests  

---

## Prerequisites

- Node.js v16+  
- NPM installed  
- Azure Cosmos DB with container `SensorAggregations`  
- Environment variables configured (`.env` or Azure App Settings)  
- Stream Analytics job already writing data to Cosmos DB  

---

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/CST8916_RideauCanal_Dashboard.git
cd CST8916_RideauCanal_Dashboard
```
### 2. Install dependencies
```bash
npm install
```
### 3. Create a .env file
Create a file named .env in the project root:
```
COSMOS_ENDPOINT=<your-cosmos-url>
COSMOS_KEY=<your-primary-key>
COSMOS_DATABASE=RideauCanalDB
COSMOS_CONTAINER=SensorAggregations
PORT=3000
```
### 4. Start the server locally
```bash
npm start
```
Dashboard will be available at:
http://localhost:3000/

## Configuration

The dashboard reads its settings from **environment variables**:

- **Local Environment (`.env`)** – used during development  
- **Azure App Service → Configuration → Application Settings** – required for cloud deployment  

**Required Variables:**  
`COSMOS_ENDPOINT`, `COSMOS_KEY`, `COSMOS_DATABASE`, `COSMOS_CONTAINER`, `PORT`
## API Endpoints

### 1. `/api/latest`
Returns the **latest aggregated readings** for each location.

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "location": "Dow's Lake",
      "avgIceThickness": 32.1,
      "avgSurfaceTemperature": -5.2,
      "avgSnowAccumulation": 3.4,
      "safetyStatus": "Safe",
      "windowEndTime": "2025-12-11T01:22:00Z"
    }
  ]
}
```
### 2. `/api/history/:location`
Returns the **last 12 historical readings** for a specific location.

**Example Request:**
```
/api/history/Dow's%20Lake?limit=12
```
### 3. `/api/status`

Returns overall system safety status and individual location statuses.

**Sample Output:**
```
{
  "success": true,
  "overallStatus": "Caution",
  "locations": [
    { "location": "NAC", "safetyStatus": "Unsafe" }
  ]
}
```
### 4. `/api/all` (Debug)
Returns **all documents** in the Cosmos DB container.  
**Only for testing purposes.**

---

## Deployment to Azure App Service

### 1. Create App Service
- Go to **Azure Portal**  
- Search **App Services → Create**  
- Runtime: **Node.js 18 LTS**  
- Hosting: **Linux**  
- Create a new **App Service Plan**

### 2. Enable Website Startup Command
- Navigate to **App Service → Configuration → Application Settings**  
- Add the following :
```
WEBSITE_RUN_FROM_PACKAGE=1
```
### 3. Upload Code via Deployment Center
- Go to **Deployment Center** in your App Service  
- Choose **GitHub** or **Local Git**  
- Select your **repository and branch**  
- Deploy the code  

### 4. Add Application Settings
- Navigate to **App Service → Configuration → Application Settings**  
- Add the following environment variables:
```
COSMOS_ENDPOINT=<value>
COSMOS_KEY=<value>
COSMOS_DATABASE=RideauCanalDB
COSMOS_CONTAINER=SensorAggregations
PORT=3000
```
- Click **Save** and **Restart** the App Service

### 5. Visit Your Live Dashboard
```
https://<your-app-name>.azurewebsites.net
```

## Dashboard Features 

- **Real-Time Updates:** Frontend pulls API data every few seconds  
- **Charts & Visualizations:** Historical data displayed using Chart.js  
- **Safety Status Indicators:**  
  - Green → Safe  
  - Yellow → Caution  
  - Red → Unsafe  
- Displays **overall canal safety** and per-location status  

---

## Troubleshooting

### 1. Dashboard stuck on “Loading…”
- **Cause:** Cosmos DB returned no documents or Stream Analytics not sending data  
- **Fix:** Ensure Stream Analytics output is correctly writing to Cosmos DB  

### 2. ERR_INVALID_URL error when starting server
- **Cause:** `.env` not loaded or missing values  
- **Fix:** Place `.env` in the root folder with all required variables  

### 3. “Cosmos types 'nvarchar' / ‘varbinary’ only support max”
- **Cause:** Incorrect data type in Stream Analytics output schema  
- **Fix:** Change types to `nvarchar(max)` in Stream Analytics output mapping  

### 4. No data showing after deployment
- **Cause:** Missing App Service environment variables  
- **Fix:** Add all required keys under **App Service → Configuration → A**


## Conclusion

This web dashboard forms the final and most visible component of the Rideau Canal Monitoring System. It integrates sensor data, Azure IoT Hub, Stream Analytics, Cosmos DB, and cloud deployment into a real-time monitoring interface that is both user-friendly and visually clear. The dashboard demonstrates technical integration across multiple Azure services while providing a practical solution for monitoring canal ice safety.

#  AI Tools Disclosure
I used ChatGPT only for help with wording in the documentation, general coding guidance, and small debugging tips. All the sensor simulator coding, Azure setup, testing, and actual implementation were done entirely by me.
