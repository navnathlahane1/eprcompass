type Cookie = { name: string; value: string };

function parseToken(raw: string): string | undefined {
  try {
    const decoded = raw.startsWith('base64-')
      ? Buffer.from(raw.slice(7), 'base64url').toString('utf8')
      : decodeURIComponent(raw);
    const value = JSON.parse(decoded);
    const token = typeof value === 'string' ? value
      : Array.isArray(value) ? value[0] : value?.access_token;
    return typeof token === 'string' && token.length > 0 ? token : undefined;
  } catch {
    return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(raw) ? raw : undefined;
  }
}

// Keep project cookies separate: never concatenate chunks from different projects.
export function getSessionToken(cookies: Cookie[], supabaseUrl?: string): string | undefined {
  const explicit = cookies.find(c => c.name === 'sb-access-token');
  if (explicit) return parseToken(explicit.value);

  const project = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : undefined;
  const base = project ? `sb-${project}-auth-token` : undefined;
  const candidates = base ? [base] : [...new Set(cookies
    .filter(c => /^sb-.+-auth-token(?:\.\d+)?$/.test(c.name))
    .map(c => c.name.replace(/\.\d+$/, '')))];
  if (candidates.length !== 1) return undefined;

  const single = cookies.find(c => c.name === candidates[0]);
  if (single) return parseToken(single.value);
  const chunks = cookies.filter(c => c.name.startsWith(`${candidates[0]}.`))
    .sort((a, b) => Number(a.name.split('.').pop()) - Number(b.name.split('.').pop()));
  if (!chunks.length || chunks.some((c, index) => c.name !== `${candidates[0]}.${index}`)) return undefined;
  return parseToken(chunks.map(c => c.value).join(''));
}
