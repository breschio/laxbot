import { createClient } from '@supabase/supabase-js'

// Ensure your environment variables are named correctly and accessible
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables.')
}

// Create and export the Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey) 