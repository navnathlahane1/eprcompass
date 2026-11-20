/**
 * Call only after validating the Supabase session. Both runtimes use the same
 * explicit allowlist; a generic staff role alone does not grant Intel access.
 * @param {any} db
 * @param {{id: string, email?: string | null} | null} user
 * @param {Record<string, string | undefined>} env
 * @returns {Promise<'allowed' | 'denied' | 'unavailable'>}
 */
async function checkIntelAccess(db, user, env) {
  if (!user) return 'denied';
  const id = String(env.INTEL_USER_ID || '').trim();
  const email = String(env.INTEL_USER_EMAIL || '').trim().toLowerCase();
  if ((id && user.id === id) || (email && String(user.email || '').trim().toLowerCase() === email)) return 'allowed';
  try {
    const { data, error } = await db.from('intel_access_users').select('id')
      .eq('user_id', user.id).eq('is_active', true).maybeSingle();
    if (error) return 'unavailable';
    return data ? 'allowed' : 'denied';
  } catch { return 'unavailable'; }
}

module.exports = { checkIntelAccess };
