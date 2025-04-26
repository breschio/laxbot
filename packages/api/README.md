# Laxbot API

This package contains the backend API server, route handlers, scrapers, and utilities for Laxbot 1.0.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Start the server (dev):
   ```
   npx ts-node server.ts
   ```

## Structure

- `/routes` — API route handlers
- `/scrapers` — Web scrapers for lacrosse data
- `/utils` — Helper utilities for scraping/transforming data

## Endpoints

- `GET /api/teams` — Returns static team data (replace with DB query later)

## Future Plans

- Integrate with `/packages/db` for live data
- Add cron jobs/scheduled tasks for scraping and updating data
- Expand API endpoints for standings, stats, etc. 