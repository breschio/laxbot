import { createClient } from '@supabase/supabase-js';

// These values need to be replaced with actual Supabase credentials
// For development, they can be temporary hardcoded or loaded from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Log a more helpful message about missing environment variables
if (!supabaseUrl) {
  console.error('Error: Missing VITE_SUPABASE_URL environment variable.');
  console.error('Please add it to your .env file in the web app directory.');
}

if (!supabaseAnonKey) {
  console.error('Error: Missing VITE_SUPABASE_ANON_KEY environment variable.');
  console.error('Please add it to your .env file in the web app directory.');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase client will be initialized with empty values and will not work correctly.');
}

// Create a single supabase client for the frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
}); 