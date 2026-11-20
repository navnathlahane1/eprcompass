import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const fallbackUrl = 'https://example.supabase.co';
const fallbackAnonKey = 'placeholder-anon-key';
const hasRealSupabaseUrl = Boolean(supabaseUrl) && !String(supabaseUrl).includes('example.supabase.co');
const hasRealSupabaseAnonKey = Boolean(supabaseAnonKey) && String(supabaseAnonKey) !== fallbackAnonKey;

export const isSupabaseConfigured = hasRealSupabaseUrl && hasRealSupabaseAnonKey;

if ((!supabaseUrl || !supabaseAnonKey) && typeof window !== 'undefined') {
  console.warn('Supabase env vars are missing. Using placeholder client until env vars are configured.');
}

export const supabase = createClient(
  supabaseUrl || fallbackUrl,
  supabaseAnonKey || fallbackAnonKey
);
