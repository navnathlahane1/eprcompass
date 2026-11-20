import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ actor: vi.fn(), from: vi.fn(), findIdentity: vi.fn(), createUser: vi.fn(), deleteUser: vi.fn(), updateUserById: vi.fn(), getUserById: vi.fn(), createTask: vi.fn() }));
vi.mock('@/lib/recyclerNetwork/networkAuth', () => ({ resolveActor: mocks.actor }));
vi.mock('@/lib/admin/clientIdentity', () => ({ findClientIdentity: mocks.findIdentity }));
vi.mock('@/lib/tasks/createTask', () => ({ createTask: mocks.createTask }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ from: mocks.from, auth: { admin: { createUser: mocks.createUser, deleteUser: mocks.deleteUser, updateUserById: mocks.updateUserById, getUserById: mocks.getUserById } } }) }));
import { POST } from '@/app/api/admin/clients/route';

function query(result: object) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ['select', 'insert', 'upsert', 'update', 'delete', 'eq']) chain[method] = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(async () => result);
  chain.single = vi.fn(async () => result);
  chain.then = vi.fn(resolve => Promise.resolve(result).then(resolve));
  return chain;
}
function request(body: object, origin = 'http://localhost:3000') {
  return new NextRequest('http://localhost:3000/api/admin/clients', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
}
const valid = { email: ' Person@Example.com ', full_name: ' Person ', company_name: ' Company ', category: 'Producer' };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.actor.mockResolvedValue({ userId: 'admin', isAdmin: true });
  mocks.findIdentity.mockResolvedValue(null);
  mocks.createUser.mockResolvedValue({ data: { user: { id: 'new-user' } }, error: null });
  mocks.getUserById.mockResolvedValue({ data: { user: { email: 'existing@example.com' } }, error: null });
  mocks.from.mockImplementation(() => query({ data: null, error: null }));
});

describe('admin client creation identity boundaries', () => {
  it('rejects cross-origin writes before checking accounts', async () => {
    expect((await POST(request(valid, 'https://other.example'))).status).toBe(403);
    expect(mocks.actor).not.toHaveBeenCalled();
  });
  it.each([null, { isAdmin: false }])('requires an authorized account manager', async actor => {
    mocks.actor.mockResolvedValue(actor);
    expect((await POST(request(valid))).status).toBe(actor ? 403 : 401);
    expect(mocks.findIdentity).not.toHaveBeenCalled();
    expect(mocks.createUser).not.toHaveBeenCalled();
  });
  it.each([{ canLink: true, clientId: null }, { canLink: false, clientId: 'existing-company' }, { canLink: false, clientId: null }])('never recreates or resets an existing exact-email account: %j', async identity => {
    mocks.findIdentity.mockResolvedValue({ id: 'existing-user', email: 'person@example.com', ...identity });
    const response = await POST(request(valid));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ existingUser: { id: 'existing-user', ...identity } });
    expect(mocks.findIdentity).toHaveBeenCalledWith(expect.anything(), 'person@example.com');
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.updateUserById).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('stops on failed account preflight instead of attempting user creation', async () => {
    mocks.findIdentity.mockRejectedValue(new Error('offline'));
    expect((await POST(request(valid))).status).toBe(503);
    expect(mocks.createUser).not.toHaveBeenCalled();
  });
  it('upserts a profile created by an auth trigger only for a genuinely new identity', async () => {
    const profile = query({ error: null });
    const company = query({ data: { id: 'new-company' }, error: null });
    mocks.from.mockReturnValueOnce(profile).mockReturnValueOnce(company);
    const response = await POST(request(valid));
    expect(response.status).toBe(201);
    expect(profile.upsert).toHaveBeenCalledWith({ id: 'new-user', role: 'client', full_name: 'Person', company_name: 'Company', phone: null, gstin: null, state: null }, { onConflict: 'id' });
    expect(company.insert).toHaveBeenCalledWith(expect.objectContaining({ profile_id: 'new-user', name: 'Company', status: 'Onboarding', assigned_manager_id: null, notes: null, renewal_date: null, intel_company_id: null }));
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });
  it('rolls back only its newly created auth identity when profile upsert fails', async () => {
    mocks.from.mockReturnValueOnce(query({ error: { message: 'write failed' } }));
    expect((await POST(request(valid))).status).toBe(500);
    expect(mocks.deleteUser).toHaveBeenCalledWith('new-user');
  });
  it('updates an existing client company in place without changing its login role or password', async () => {
    const profile = query({ data: { id: 'existing', role: 'client', company_name: 'Existing Company' }, error: null });
    const lookup = query({ data: { id: 'company' }, error: null });
    const update = query({ data: { id: 'company' }, error: null });
    mocks.from.mockReturnValueOnce(profile).mockReturnValueOnce(lookup).mockReturnValueOnce(update);
    const response = await POST(request({ existing_profile_id: 'existing', category: 'Producer', password: 'IgnoredPassword123!' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ clientId: 'company', profileId: 'existing', linked: true, temporaryPassword: null });
    expect(update.update).toHaveBeenCalledWith(expect.objectContaining({ profile_id: 'existing', name: 'Existing Company' }));
    expect(update.eq).toHaveBeenCalledWith('id', 'company');
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.updateUserById).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(profile.update).not.toHaveBeenCalled();
  });
  it('does not convert another IAM role when asked to link a profile', async () => {
    mocks.from.mockReturnValueOnce(query({ data: { id: 'existing', role: 'recycler' }, error: null }));
    expect((await POST(request({ existing_profile_id: 'existing', category: 'Producer' }))).status).toBe(400);
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });
  it.each(['profileLookup', 'clientLookup', 'profileUpdate'])('fails closed on existing-account %s errors', async stage => {
    const okay = { error: null };
    const failed = { data: null, error: { message: 'backend unavailable' } };
    mocks.from.mockReturnValueOnce(query(stage === 'profileLookup' ? failed : { data: { id: 'existing', role: 'client' }, ...okay }));
    if (stage !== 'profileLookup') mocks.from.mockReturnValueOnce(query(stage === 'clientLookup' ? failed : { data: null, ...okay }));
    if (stage === 'profileUpdate') mocks.from.mockReturnValueOnce(query(failed));
    expect((await POST(request({ existing_profile_id: 'existing', category: 'Producer', company_name: 'Updated' }))).status).toBe(503);
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });
});
