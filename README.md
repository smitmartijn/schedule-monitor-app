# Laravel Schedule Monitor Dashboard

A lightweight monitoring dashboard for Laravel scheduled tasks built with Nuxt.js and Cloudflare Pages.

**Disclaimer**: I built this for WhatPulse, and don't intend on productizing it beyond my use cases. PRs are welcome, though!

## Features

- 📊 Real-time status dashboard for Laravel scheduled jobs
- 🔔 Monitor job heartbeats and detect missed schedules
- ⏱️ Configurable grace periods for each job
- 🔄 Easy synchronization with your Laravel application
- 📱 Responsive design that works on desktop and mobile
- 🔒 Secure API token authentication
- 🌐 JSON API for integration with external monitoring services

## Tech Stack

- **Nuxt.js 3**: Vue-based framework for the frontend and API
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Cloudflare D1**: SQLite database for storing job configurations and heartbeats
- **Cloudflare Pages**: Hosting platform with serverless functions

## Getting Started

### Prerequisites

- Node.js 16+
- Cloudflare account
- Wrangler CLI

### Local Development

1. Clone this repository:
   ```bash
   git clone https://github.com/smitmartijn/schedule-monitor-app.git
   cd schedule-monitor-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your API secret:
   ```
   API_SECRET=your-secure-api-key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. The app will be available at `http://localhost:3000`

### Setting Up the Database

1. Create a D1 database:
   ```bash
   wrangler d1 create schedule_monitor
   ```

2. Update your `wrangler.toml` with the database ID:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "schedule_monitor"
   database_id = "YOUR_DATABASE_ID"
   ```

3. Apply database migrations:
   ```bash
   mkdir -p migrations

   # Create migration file
   cat > migrations/0000_initial_schema.sql << EOL
   CREATE TABLE jobs (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     schedule TEXT NOT NULL,
     last_heartbeat INTEGER,
     next_expected_run INTEGER,
     grace_minutes INTEGER DEFAULT 15,
     is_monitored INTEGER DEFAULT 1,
     created_at INTEGER,
     updated_at INTEGER
   );

   CREATE TABLE heartbeats (
     id TEXT PRIMARY KEY,
     job_id TEXT NOT NULL,
     received_at INTEGER NOT NULL,
     runtime INTEGER,
     status TEXT DEFAULT 'success'
   );

   CREATE TABLE sync_logs (
     id TEXT PRIMARY KEY,
     synced_at INTEGER NOT NULL,
     source_ip TEXT,
     job_count INTEGER
   );
   EOL

   # Apply migration
   wrangler d1 execute schedule_monitor --file=./migrations/0000_initial_schema.sql
   ```

### Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to Cloudflare Pages:
   ```bash
   wrangler pages deploy .output/public
   ```

3. In the Cloudflare Dashboard, set up your environment variables:
   - Add `API_SECRET` with your secure API key

4. Bind your D1 database in the Cloudflare Dashboard:
   - Go to "Pages" > Your Project > "Settings" > "Functions"
   - Under "D1 database bindings", add your database with variable name `DB`

## API Endpoints

### Authentication

All API endpoints (except `GET /api/status`) require authentication with a Bearer token:

```
Authorization: Bearer your-api-secret
```

### Available Endpoints

#### `POST /api/sync`

Syncs job configurations from your Laravel application.

**Request Body:**
```json
{
  "jobs": [
    {
      "name": "php artisan emails:send",
      "description": "Send daily emails",
      "schedule": "0 8 * * *",
      "graceMinutes": 30,
      "isMonitored": true
    }
  ]
}
```

#### `POST /api/heartbeat`

Receives heartbeats from running jobs.

**Request Body:**
```json
{
  "job": "php artisan emails:send",
  "status": "success",
  "runtime": 2.5
}
```

#### `GET /api/status`

Returns the status of all jobs (public endpoint for monitoring services).

**Response:**
```json
{
  "status": "healthy",
  "lastSyncedAt": "2025-03-30T14:00:00.000Z",
  "missedJobCount": 0,
  "missedJobs": [],
  "jobs": [
    {
      "name": "php artisan emails:send",
      "description": "Send daily emails",
      "status": "healthy",
      "schedule": "0 8 * * *",
      "lastHeartbeat": "2025-03-30T08:02:15.000Z",
      "nextExpectedRun": "2025-03-31T08:00:00.000Z",
      "graceMinutes": 30,
      "isMonitored": true
    }
  ]
}
```

## Monitoring with External Services

You can integrate with monitoring services like Pingdom, UptimeRobot, or Datadog by having them check the `/api/status` endpoint. Configure alerts when:

- The response status code is not 200
- The `status` field in the response is not "healthy"
- The `missedJobCount` is greater than 0

## Job Status Types

- **Healthy**: The job is running on schedule and reporting heartbeats
- **Warning**: The job is past its expected run time but within the grace period
- **Missed**: The job has missed its expected run time (past grace period)
- **Unknown**: The job has been configured but hasn't reported a heartbeat yet

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.