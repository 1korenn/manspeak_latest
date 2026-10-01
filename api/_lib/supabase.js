/* Server-only Supabase client. Uses the SERVICE ROLE key, which bypasses
   row-level security, so it must never be imported by anything in src/. */
import { createClient } from '@supabase/supabase-js';

let client = null;

export function getSupabase(){
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
