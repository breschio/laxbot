import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get directory path in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root directory
config({ path: resolve(__dirname, '../../.env') });

async function testSupabaseConnection() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ SUPABASE_URL and SUPABASE_ANON_KEY must be set');
    process.exit(1);
  }

  console.log('Connecting to Supabase URL:', process.env.SUPABASE_URL);
  
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // Test query to verify connection
    console.log('Attempting to query teams table...');
    const { data, error } = await supabase.from('teams').select('*').limit(5);
    
    if (error) throw error;
    
    console.log('✅ Successfully connected to Supabase');
    console.log(`Retrieved ${data.length} teams:`);
    
    if (data.length > 0) {
      data.forEach(team => {
        console.log(`- ${team.name} (${team.abbreviation})`);
      });
    } else {
      console.log('No teams found in the database yet.');
    }
    
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error);
    process.exit(1);
  }
}

testSupabaseConnection(); 