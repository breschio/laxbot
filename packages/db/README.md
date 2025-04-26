# Laxbot DB (Drizzle ORM + PostgreSQL)

This package contains the database schema and migration logic for Laxbot 1.0 using Drizzle ORM and PostgreSQL (Supabase).

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase Postgres connection string:
   ```
   cp .env.example .env
   ```
2. Install dependencies:
   ```
   npm install
   ```

## Migrations

- Generate migrations after editing schema:
  ```
  npx drizzle-kit generate:pg
  ```
- Apply migrations:
  ```
  npx drizzle-kit migrate:pg
  ```

## Usage

Import the Drizzle client and schema tables from `db.ts`:

```ts
import { db, teams, players } from '@laxbot/db';
```

## Schema
- All table schemas are in `/schema`. 