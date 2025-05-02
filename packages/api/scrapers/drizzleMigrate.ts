import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/pg-core/migrate';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../../.env');
console.log('Loading environment variables from:', envPath);
dotenv.config({ path: envPath });

// SQL for table creation
const SQL_CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS "stgScoreboard" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "source_id" text NOT NULL,
  "raw_payload" jsonb NOT NULL,
  "scraped_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
`;

async function main() {
  // Check if DATABASE_URL exists
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not found in environment');
    process.exit(1);
  }
  
  console.log('Connecting to database using direct PostgreSQL connection...');
  console.log('Database URL:', dbUrl.replace(/:[^:@]+@/, ':***@')); // Hide password
  
  try {
    const pool = new Pool({ connectionString: dbUrl });
    console.log('Connected to PostgreSQL');
    
    // Execute SQL directly
    console.log('Creating stgScoreboard table...');
    await pool.query(SQL_CREATE_TABLE);
    console.log('Table created or already exists');
    
    // Verify table exists
    console.log('Verifying table...');
    const { rows } = await pool.query(`
      SELECT * FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'stgScoreboard'
    `);
    
    if (rows.length === 0) {
      console.error('Table was not created');
    } else {
      console.log('Table exists in database');
    }
    
    // Close pool
    await pool.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Migration error:', error);
  }
}

main(); 