import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get directory path in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root directory
const envPath = resolve(__dirname, '../../.env');
console.log('Loading .env from:', envPath);
config({ path: envPath });

async function createStagingTable() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
  }

  console.log('Connecting to Supabase...');
  
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Attempt to create staging table using Supabase Storage API
    console.log('Creating stgScoreboard table...');
    
    // Check if table exists first
    const { data: existingData, error: queryError } = await supabase
      .from('stgScoreboard')
      .select('id')
      .limit(1);
      
    if (queryError && queryError.message.includes('does not exist')) {
      console.log('Table does not exist, creating it...');
      
      // We need to use SQL to create the table since Supabase doesn't have a direct API for this
      // For this example, we'll use an RPC function to execute SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS "stgScoreboard" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source_id TEXT NOT NULL,
          raw_payload JSONB NOT NULL,
          scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Create index on source_id for faster queries
        CREATE INDEX IF NOT EXISTS stgScoreboard_source_id_idx ON "stgScoreboard" (source_id);
      `;
      
      // Execute SQL via an RPC function or direct SQL if available
      // Note: This requires a custom function to be set up in Supabase
      // If this fails, you'll need to run this SQL directly in the Supabase SQL editor
      try {
        const { error: sqlError } = await supabase.rpc('execute_sql', { sql: createTableSQL });
        
        if (sqlError) {
          console.error('❌ Error creating table via RPC:', sqlError);
          console.log('\nPlease run the following SQL in the Supabase SQL Editor:');
          console.log(createTableSQL);
        } else {
          console.log('✅ Successfully created stgScoreboard table');
        }
      } catch (rpcError) {
        console.error('❌ RPC function not available:', rpcError);
        console.log('\nPlease run the following SQL in the Supabase SQL Editor:');
        console.log(createTableSQL);
      }
    } else if (queryError) {
      console.error('❌ Unexpected error checking for table:', queryError);
    } else {
      console.log('✅ stgScoreboard table already exists');
      
      // Test inserting a sample record
      const sampleData = {
        source_id: 'test',
        raw_payload: { message: 'This is a test payload' }
      };
      
      const { data: insertedData, error: insertError } = await supabase
        .from('stgScoreboard')
        .insert(sampleData)
        .select();
      
      if (insertError) {
        console.error('❌ Error inserting test record:', insertError);
      } else {
        console.log('✅ Successfully inserted test record:', insertedData);
        
        // Clean up test data
        const { error: deleteError } = await supabase
          .from('stgScoreboard')
          .delete()
          .eq('source_id', 'test');
        
        if (deleteError) {
          console.error('❌ Error cleaning up test record:', deleteError);
        } else {
          console.log('✅ Cleaned up test record');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createStagingTable(); 