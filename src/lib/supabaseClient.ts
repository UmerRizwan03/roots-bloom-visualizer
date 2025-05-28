import { createClient } from '@supabase/supabase-js';

// IMPORTANT: These environment variables will need to be set up by the user.
// For Vite projects, environment variables prefixed with VITE_ are exposed to the client.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase URL or Anon Key is missing. ' +
    'Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
  // You might want to throw an error here or handle this case more gracefully
  // depending on how critical Supabase is at startup.
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
