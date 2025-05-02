import { supabase } from './supabase';

// Function to check Supabase connection and log status
export async function checkSupabaseConnection() {
  try {
    console.log('Checking Supabase connection...');
    console.log('Supabase URL:', supabase.supabaseUrl || 'Not set');
    console.log('Supabase Key Length:', supabase.supabaseKey ? `${supabase.supabaseKey.length} chars` : 'Not set');

    // Try a simple query to verify connection
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Supabase connection failed:', error.message);
      console.error('Error details:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    console.log('Supabase connection successful!');
    console.log('Data received:', data);
    return {
      success: true,
      data
    };
  } catch (err) {
    console.error('Exception when connecting to Supabase:', err);
    return {
      success: false,
      error: String(err)
    };
  }
} 