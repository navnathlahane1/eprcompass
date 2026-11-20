import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const { actor, from, rpc, getUser } = vi.hoisted(() => ({ actor: vi.fn(), from: vi.fn(), rpc: vi.fn(), getUser: vi.fn() }));
vi.mock('./clientAuth', () => ({ resolveClientActor: actor, adminClient: () => ({ from }) }));
vi.mock('@/lib/supabase/createServerComponentClient', () => ({ createServerComponentClient: async () => ({ rpc, auth: { getUser } }) }));
import { POST as invite, GET as team } from '@/app/api/portal/team/route';
import { DELETE as remove } from '@/app/api/portal/team/[memberId]/route';
import { POST as accept } from '@/app/api/portal/team/accept/route';

function query(result: object) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ['select','insert','update','delete','eq','gt','order','limit']) chain[method] = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(async () => result);
  chain.single = vi.fn(async () => result);
  chain.then = vi.fn((resolve) => Promise.resolve(result).then(resolve));
  return chain;
}
function request(body: object, method = 'POST', origin = 'http://localhost:3000') {
  return new NextRequest('http://localhost:3000/api/portal/team', { method, headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
}
beforeEach(() => {
  vi.clearAllMocks();
  actor.mockResolvedValue({ userId: 'owner', clientId: 'company-a', memberRole: 'OWNER' });
  getUser.mockResolvedValue({ data: { user: { id: 'member' } } });
});
describe('client team boundaries', () => {
  it('rejects cross-origin mutation before database work', async () => {
    expect((await invite(request({}, 'POST', 'https://other.example'))).status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });
  it('does not let a member invite colleagues', async () => {
    actor.mockResolvedValue({ memberRole: 'VIEWER' });
    expect((await invite(request({}))).status).toBe(403);
  });
  it('rejects malformed email and privileged roles', async () => {
    expect((await invite(request({ email:'invalid', full_name:'Member', member_role:'VIEWER' }))).status).toBe(400);
    expect((await invite(request({ email:'a@example.com', full_name:'Member', member_role:'OWNER' }))).status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });
  it('creates an email-bound invitation without creating an auth identity or returning a password', async () => {
    const insert = query({ data: { id: 'invite' }, error: null });
    from.mockReturnValueOnce(query({ data:null,error:null })).mockReturnValueOnce(query({ data:[],error:null })).mockReturnValueOnce(insert);
    const response = await invite(request({email:'Member@Example.com',full_name:'Member',member_role:'VIEWER'}));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.tempPassword).toBeUndefined();
    expect(body.invitationPath).toMatch(/^\/team-invitation#token=[a-f0-9]{64}$/);
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({client_id:'company-a',email:'member@example.com',member_role:'VIEWER',token_hash:expect.stringMatching(/^[a-f0-9]{64}$/)}));
  });
  it('reports database failures instead of an empty team', async () => {
    from.mockImplementation(() => query({ data:null,error:{message:'offline'} }));
    expect((await team()).status).toBe(503);
  });
  it('removes only the resolved company membership, preserving the login', async () => {
    const deletion = query({error:null});
    from.mockReturnValueOnce(query({data:{id:'member-id',member_role:'VIEWER',user_id:'member'},error:null})).mockReturnValueOnce(deletion).mockReturnValueOnce(query({error:null}));
    expect((await remove(request({},'DELETE'),{params:Promise.resolve({memberId:'member-id'})})).status).toBe(200);
    expect(deletion.eq).toHaveBeenCalledWith('client_id','company-a');
    expect(from.mock.calls.map(([table]) => table)).toEqual(['client_team_members','client_team_members','client_activity_log']);
  });
  it('does not report removal success if persistence failed', async () => {
    from.mockReturnValueOnce(query({data:{id:'member-id',member_role:'VIEWER'},error:null})).mockReturnValueOnce(query({error:{message:'offline'}}));
    expect((await remove(request({},'DELETE'),{params:Promise.resolve({memberId:'member-id'})})).status).toBe(503);
  });
  it('requires authentication before invitation acceptance', async () => {
    getUser.mockResolvedValue({data:{user:null}});
    expect((await accept(request({token:'a'.repeat(64)}))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('returns staff-validation failures without granting access', async () => {
    rpc.mockResolvedValue({error:{code:'P0001',message:'Staff must validate and provision your client access first'}});
    expect((await accept(request({token:'a'.repeat(64)}))).status).toBe(409);
  });
});
