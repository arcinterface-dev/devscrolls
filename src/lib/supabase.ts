import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id')
);

/**
 * Detect whether the current client is running in local development mode (localhost/127.0.0.1/Vite dev).
 * Used to suppress tracking events and database updates during local development.
 */
export function isLocalhost(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '[::1]' ||
      host.endsWith('.local') ||
      host === ''
    );
  }
  return false;
}

// Graceful client creation: if keys aren't provided, create a mock-safe or dummy instance
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    });
