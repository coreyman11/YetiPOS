
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a single instance to be used throughout the app
// Using a more unique storage key to avoid conflicts
const storageKey = 'sisters-denville-pos-auth-v2';

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration missing. Please check your environment variables.');
    // Return a minimal client that will fail gracefully
    return createClient<Database>('https://placeholder.supabase.co', 'placeholder-key');
  }
  
  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey,
      persistSession: true,
      autoRefreshToken: true
    }
  });
  
  return supabaseInstance;
})();

// Export environment info for debugging
export const environmentInfo = {
  mode: import.meta.env.MODE,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  // Only expose whether variables are set, not their values
  supabaseUrlConfigured: !!supabaseUrl,
  supabaseAnonKeyConfigured: !!supabaseAnonKey,
}
