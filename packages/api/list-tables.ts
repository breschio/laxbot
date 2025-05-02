import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get directory path in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root directory (project root, not packages)
const envPath = resolve(__dirname, '../../.env');
console.log('Loading .env from:', envPath);
config({ path: envPath });

async function listTables() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
  }

  console.log('Connecting to Supabase URL:', process.env.SUPABASE_URL);
  
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );
    
    // Query information_schema.tables to get table names
    const { data, error } = await supabase
      .from('_tables')
      .select('*');
    
    if (error) {
      // If the special _tables view isn't available, try a direct SQL query
      const { data: tables, error: sqlError } = await supabase.rpc('list_tables');
      
      if (sqlError) {
        throw sqlError;
      }
      
      console.log('✅ Tables in database:');
      tables.forEach((table: any) => {
        console.log(`- ${table.table_name}`);
      });
      
      return;
    }
    
    if (data) {
      console.log('✅ Tables in database:');
      data.forEach(table => {
        console.log(`- ${table.name}`);
      });
    } else {
      console.log('No tables found or insufficient permissions to list tables');
    }
    
  } catch (error) {
    console.error('❌ Failed to list tables:', error);
    
    console.log('\nTrying alternate method...');
    
    try {
      // Initialize Supabase client
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      // Try to query a few common tables
      console.log('Testing access to some common tables:');
      
      // Check teams table
      const { data: teams, error: teamsError } = await supabase.from('teams').select('*').limit(1);
      console.log('- teams table:', teamsError ? '❌ Error' : '✅ Accessible');
      
      // Check records table
      const { data: records, error: recordsError } = await supabase.from('records').select('*').limit(1);
      console.log('- records table:', recordsError ? '❌ Error' : '✅ Accessible');
      
      // Check stgScoreboard table
      const { data: stgScoreboard, error: stgError } = await supabase.from('stgScoreboard').select('*').limit(1);
      console.log('- stgScoreboard table:', stgError ? '❌ Error' : '✅ Accessible');
      
      // Check stg_scoreboard table
      const { data: stg_scoreboard, error: stg_Error } = await supabase.from('stg_scoreboard').select('*').limit(1);
      console.log('- stg_scoreboard table:', stg_Error ? '❌ Error' : '✅ Accessible');
      
    } catch (fallbackError) {
      console.error('❌ Fallback method also failed:', fallbackError);
    }
  }
}

listTables(); 