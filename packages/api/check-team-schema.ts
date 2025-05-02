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

// Debug environment variables
console.log('Environment variables:');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL || '(not set)');

async function checkSchema() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
  }

  console.log('Connecting to Supabase URL:', process.env.SUPABASE_URL);
  
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Check teams table
    console.log('Checking teams table schema...');
    const { data: teams, error: teamsError } = await supabase.from('teams').select('*').limit(1);
    
    if (teamsError) {
      console.error('❌ Error querying teams table:', teamsError);
    } else {
      console.log('✅ Teams table is accessible');
      if (teams && teams.length > 0) {
        console.log('Example team record:', teams[0]);
        console.log('Columns:', Object.keys(teams[0]).join(', '));
      } else {
        console.log('No teams found in the table.');
      }
    }

    // Try to insert a team with only required fields
    console.log('\nTesting team insertion...');
    const { data: newTeam, error: insertError } = await supabase
      .from('teams')
      .insert({
        name: 'Test Team',
        abbreviation: 'TEST'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error inserting team:', insertError);
      
      // If there's an error about a column not existing, let's check the exact schema
      if (insertError.message.includes("column")) {
        console.log('\nTrying to get exact schema information...');
        // This might not work with the default permissions, but worth a try
        const { data: columns, error: schemaError } = await supabase.rpc('get_table_columns', { table_name: 'teams' });
        
        if (schemaError) {
          console.error('❌ Error getting schema:', schemaError);
        } else if (columns) {
          console.log('Columns in teams table:', columns);
        }
      }
    } else {
      console.log('✅ Successfully inserted team:', newTeam);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSchema(); 