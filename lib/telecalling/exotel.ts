import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface ExotelConfig {
  accountSid: string;
  apiKey: string;
  apiToken: string;
  callerId: string;
  subdomain: string; // e.g. "api.exotel.com"
}

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

// Module-level cache: avoid a DB round-trip on every call
let _configCache: ExotelConfig | null = null;
let _configCachedAt = 0;
const CONFIG_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function loadExotelConfig(supabase?: SupabaseClient): Promise<ExotelConfig | null> {
  // Prefer env vars (faster, no DB round-trip)
  if (
    process.env.EXOTEL_ACCOUNT_SID &&
    process.env.EXOTEL_API_KEY &&
    process.env.EXOTEL_API_TOKEN
  ) {
    return {
      accountSid: process.env.EXOTEL_ACCOUNT_SID,
      apiKey: process.env.EXOTEL_API_KEY,
      apiToken: process.env.EXOTEL_API_TOKEN,
      callerId: process.env.EXOTEL_CALLER_ID || '',
      subdomain: process.env.EXOTEL_SUBDOMAIN || 'api.exotel.com',
    };
  }

  // Fall back to DB settings with TTL cache
  const now = Date.now();
  if (_configCache && now - _configCachedAt < CONFIG_TTL_MS) return _configCache;

  const db = supabase ?? makeServiceClient();
  const { data } = await db.from('tc_settings').select('key, value').in('key', [
    'exotel_account_sid', 'exotel_api_key', 'exotel_api_token', 'exotel_caller_id', 'exotel_subdomain'
  ]);

  if (!data || data.length === 0) return null;
  const map = Object.fromEntries(data.map((r: any) => [r.key, r.value || '']));

  if (!map.exotel_account_sid || !map.exotel_api_key || !map.exotel_api_token) return null;

  _configCache = {
    accountSid: map.exotel_account_sid,
    apiKey: map.exotel_api_key,
    apiToken: map.exotel_api_token,
    callerId: map.exotel_caller_id || '',
    subdomain: map.exotel_subdomain || 'api.exotel.com',
  };
  _configCachedAt = now;
  return _configCache;
}

export function invalidateExotelConfigCache() {
  _configCache = null;
  _configCachedAt = 0;
}

export async function initiateCall(
  from: string,
  to: string,
  config: ExotelConfig
): Promise<{ callSid: string; status: string }> {
  const url = `https://${config.apiKey}:${config.apiToken}@${config.subdomain}/v1/Accounts/${config.accountSid}/Calls/connect.json`;

  const body = new URLSearchParams({
    From: from,
    To: to,
    CallerId: config.callerId || from,
    StatusCallback: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/telecalling/exotel-webhook?secret=${process.env.EXOTEL_WEBHOOK_SECRET || ''}`,
    Record: 'true',
    MaxDuration: '3600',
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Exotel API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const call = data?.Call;
  return {
    callSid: call?.Sid || '',
    status: call?.Status || 'unknown',
  };
}

export async function getCallDetails(
  callSid: string,
  config: ExotelConfig
): Promise<{ status: string; duration: number; recordingUrl: string | null }> {
  const url = `https://${config.apiKey}:${config.apiToken}@${config.subdomain}/v1/Accounts/${config.accountSid}/Calls/${callSid}.json`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Exotel API error ${res.status}`);

  const data = await res.json();
  const call = data?.Call;
  return {
    status: call?.Status || 'unknown',
    duration: parseInt(call?.Duration || '0', 10),
    recordingUrl: call?.RecordingUrl || null,
  };
}
