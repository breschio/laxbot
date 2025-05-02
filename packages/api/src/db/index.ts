import { drizzle } from 'drizzle-orm/node-postgres';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Function to find project root (containing .env)
function findProjectRoot(startDir: string): string {
  let currentDir = startDir;
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, '.env'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  // Check one level up from root in case it's directly in workspace root
  const oneLevelUp = path.dirname(startDir); 
  if (fs.existsSync(path.join(oneLevelUp, '.env'))) {
     return oneLevelUp;
  }
  throw new Error('Could not find project root containing .env file starting from ' + startDir);
}

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
let envPath: string | undefined;
try {
  const projectRoot = findProjectRoot(__dirname);
  envPath = path.join(projectRoot, '.env');
  dotenv.config({ path: envPath });
  console.log(`[DB Init] Loaded .env from: ${envPath}`);
} catch (error) {
  console.error(`[DB Init] Error finding/loading .env: ${error}`);
  // Attempt to load from default location if root search fails
  dotenv.config(); 
}

const connectionString = process.env.DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!connectionString) {
  console.error('[DB Init] DATABASE_URL environment variable is not set. Ensure .env is loaded correctly.');
  throw new Error('DATABASE_URL environment variable is not set.');
}
if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is not set.');
}
if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Create Drizzle client
const pool = new pg.Pool({
  connectionString: connectionString,
});
export const db = drizzle(pool);

// Keep existing schema re-exports
export * from '../schema'; // Re-export everything from the schema index
export * from '../schema/conferences';
export * from '../schema/teams';
export * from '../schema/stg_scoreboard';
export * from '../schema/player_stats';
export * from '../schema/team_stats';
export * from '../schema/players';
export * from '../schema/team_rosters';
export * from '../schema/records';
export * from '../schema/rankings'; 