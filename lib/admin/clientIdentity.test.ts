import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { findClientIdentity } from './clientIdentity';

function fixture(users: { id: string; email?: string }[] = []) {
  const listUsers = vi.fn().mockResolvedValue({ data: { users }, error: null });
  const profile = vi.fn().mockResolvedValue({ data: { role: 'client' }, error: null });
  const company = vi.fn().mockResolvedValue({ data: null, error: null });
  const from = vi.fn((table: string) => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: table === 'profiles' ? profile : company })) })) }));
  const db = { auth: { admin: { listUsers } }, from } as unknown as SupabaseClient;
  return { db, listUsers, profile, company, from };
}

describe('existing client identity lookup', () => {
  it('matches a whole email case-insensitively without accepting prefixes or substrings', async () => {
    const f = fixture([{ id: 'wrong', email: 'other-person@example.com' }, { id: 'exact', email: 'Person@Example.com' }]);
    expect(await findClientIdentity(f.db, 'person@example.com')).toEqual({ id: 'exact', email: 'Person@Example.com', canLink: true, clientId: null });
    expect(await findClientIdentity(f.db, 'person')).toBeNull();
  });
  it.each(['recycler', 'admin', null])('does not reclassify an existing %s profile as a client', async role => {
    const f = fixture([{ id: 'existing', email: 'person@example.com' }]);
    f.profile.mockResolvedValue({ data: role ? { role } : null, error: null });
    expect(await findClientIdentity(f.db, 'person@example.com')).toMatchObject({ canLink: false });
  });
  it('identifies an already provisioned company instead of inviting duplicate creation', async () => {
    const f = fixture([{ id: 'existing', email: 'person@example.com' }]);
    f.company.mockResolvedValue({ data: { id: 'company' }, error: null });
    expect(await findClientIdentity(f.db, 'person@example.com')).toMatchObject({ canLink: false, clientId: 'company' });
  });
  it('continues past a full auth page and stops after an incomplete page', async () => {
    const f = fixture();
    f.listUsers.mockResolvedValueOnce({ data: { users: Array.from({ length: 1000 }, (_, i) => ({ id: `u${i}`, email: `u${i}@example.com` })) }, error: null });
    expect(await findClientIdentity(f.db, 'absent@example.com')).toBeNull();
    expect(f.listUsers.mock.calls).toEqual([[{ page: 1, perPage: 1000 }], [{ page: 2, perPage: 1000 }]]);
    expect(f.from).not.toHaveBeenCalled();
  });
  it.each(['auth', 'profile', 'company'])('fails closed when %s lookup is unavailable', async stage => {
    const f = fixture([{ id: 'existing', email: 'person@example.com' }]);
    const error = { message: 'private backend error' };
    if (stage === 'auth') f.listUsers.mockResolvedValue({ data: null, error });
    if (stage === 'profile') f.profile.mockResolvedValue({ data: null, error });
    if (stage === 'company') f.company.mockResolvedValue({ data: null, error });
    await expect(findClientIdentity(f.db, 'person@example.com')).rejects.toThrow(/Unable to check/);
  });
});
