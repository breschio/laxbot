import { supabase } from 'db';

async function main() {
  console.log('Creating required tables in Supabase...');
  
  try {
    // Create stgScoreboard table if it doesn't exist
    console.log('Creating stgScoreboard table...');
    const { error: createError } = await supabase.rpc('create_stg_scoreboard_table');
    
    if (createError) {
      console.error('Error creating stgScoreboard table with RPC:', createError);
      
      // Fall back to direct SQL
      console.log('Trying direct SQL...');
      const { error: sqlError } = await supabase.rpc('run_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS "stgScoreboard" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "source_id" text NOT NULL,
            "raw_payload" jsonb NOT NULL,
            "scraped_at" timestamp with time zone DEFAULT now() NOT NULL,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL
          );
        `
      });
      
      if (sqlError) {
        console.error('Error creating table with SQL:', sqlError);
        
        // Last resort - try direct query API
        console.log('Trying Supabase REST API to create table...');
        const { error: createTableError } = await supabase
          .from('_schemas')
          .insert({
            name: 'public',
            tables: [{
              name: 'stgScoreboard',
              columns: [
                { name: 'id', type: 'uuid', is_primary: true, default_value: 'gen_random_uuid()' },
                { name: 'source_id', type: 'text', is_nullable: false },
                { name: 'raw_payload', type: 'jsonb', is_nullable: false },
                { name: 'scraped_at', type: 'timestamptz', is_nullable: false, default_value: 'now()' },
                { name: 'created_at', type: 'timestamptz', is_nullable: false, default_value: 'now()' }
              ]
            }]
          });
        
        if (createTableError) {
          console.error('All table creation attempts failed:', createTableError);
        } else {
          console.log('Table created successfully using REST API');
        }
      } else {
        console.log('Table created successfully using SQL');
      }
    } else {
      console.log('Table created successfully using RPC');
    }
    
    // Try an insert to confirm table exists
    const testData = {
      source_id: 'test-source',
      raw_payload: { test: true, timestamp: new Date().toISOString() }
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('stgScoreboard')
      .insert(testData)
      .select();
    
    if (insertError) {
      console.error('Insert test failed:', insertError);
    } else {
      console.log('Insert test succeeded:', insertData);
      console.log('Table is ready for use');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main(); 