import { supabase } from 'db';

async function main() {
  console.log('Testing Supabase connection...');
  
  try {
    // 1. Check if we can connect to Supabase
    const { data: tables, error: tablesError } = await supabase
      .from('_tables')
      .select('*');
    
    if (tablesError) {
      console.error('Error getting tables:', tablesError);
    } else {
      console.log('Tables list success. Got', tables?.length || 0, 'tables');
    }
    
    // 2. List all tables in the database
    const { data: allTables, error: listError } = await supabase
      .rpc('list_tables');
    
    if (listError) {
      console.error('Error listing tables:', listError);
    } else {
      console.log('Available tables:', allTables);
    }
    
    // 3. Try to create a new table for testing if needed
    console.log('Testing basic operations...');
    
    // Create a test entry in a test table
    const testRecord = {
      test_field: 'test value',
      created_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('stgScoreboard')
      .insert({
        source_id: 'test-source',
        raw_payload: testRecord
      })
      .select();
    
    if (insertError) {
      console.error('Insert error:', insertError);
      
      if (insertError.message?.includes('does not exist')) {
        console.log('Table does not exist, the name might be incorrect');
      }
    } else {
      console.log('Insert successful:', insertData);
    }
    
    // Try to query stgScoreboard table
    const { data: scoreboardData, error: scoreboardError } = await supabase
      .from('stgScoreboard')
      .select('*')
      .limit(1);
    
    if (scoreboardError) {
      console.error('Error querying stgScoreboard:', scoreboardError);
    } else {
      console.log('stgScoreboard query successful, found', scoreboardData?.length || 0, 'records');
      if (scoreboardData && scoreboardData.length > 0) {
        console.log('First record:', scoreboardData[0]);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main(); 