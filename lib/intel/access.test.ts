import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkIntelAccess } from '@/packages/intel/access.cjs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { getUser, maybeSingle, eq, from } = vi.hoisted(() => ({ getUser:vi.fn(), maybeSingle:vi.fn(), eq:vi.fn(), from:vi.fn() }));
vi.mock('@/lib/supabase/createServerComponentClient', () => ({ createServerComponentClient:async () => ({auth:{getUser},from}) }));
vi.mock('@supabase/supabase-js', () => ({createClient:() => ({from,auth:{getUser}})}));
import { GET } from '@/app/api/intel/session/route';
import { requireIntelUser } from './server';
import { NextRequest } from 'next/server';

beforeEach(() => {
  vi.clearAllMocks();
  const query = {select:vi.fn(() => query),eq,maybeSingle};
  eq.mockReturnValue(query); from.mockReturnValue(query);
  maybeSingle.mockResolvedValue({data:null,error:null});
  getUser.mockResolvedValue({data:{user:{id:'user-1',email:'user@example.com'}},error:null});
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://example.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test');
  vi.stubEnv('INTEL_USER_ID',''); vi.stubEnv('INTEL_USER_EMAIL','');
});
import { afterEach } from 'vitest';
afterEach(() => vi.unstubAllEnvs());

describe('shared Intel access policy', () => {
  it('keeps the independently deployed backend policy identical', () => {
    const read = (path: string) => readFileSync(resolve(path), 'utf8').replaceAll('\r\n','\n');
    expect(read('../backend/middleware/intelAccess.cjs')).toBe(read('packages/intel/access.cjs'));
  });
  it('accepts a configured user id without needing an allowlist query', async () => {
    expect(await checkIntelAccess({from},{id:'user-1'},{INTEL_USER_ID:' user-1 '})).toBe('allowed');
    expect(from).not.toHaveBeenCalled();
  });
  it('normalizes configured email casing and whitespace', async () => {
    expect(await checkIntelAccess({from},{id:'user-1',email:'User@Example.com'},{INTEL_USER_EMAIL:' user@example.com '})).toBe('allowed');
  });
  it('accepts an active database allowlist user without environment allowlist entries', async () => {
    maybeSingle.mockResolvedValue({data:{id:'access-1'},error:null});
    expect(await checkIntelAccess({from},{id:'user-1'},{})).toBe('allowed');
    expect(eq).toHaveBeenCalledWith('user_id','user-1');
    expect(eq).toHaveBeenCalledWith('is_active',true);
  });
  it('denies missing or inactive allowlist membership', async () => {
    expect(await checkIntelAccess({from},{id:'user-1'},{})).toBe('denied');
  });
  it('does not confuse database failure with successful access', async () => {
    maybeSingle.mockResolvedValue({data:null,error:{message:'offline'}});
    expect(await checkIntelAccess({from},{id:'user-1'},{})).toBe('unavailable');
  });
});

describe('Intel cookie-session preflight', () => {
  it('confirms the same allowlisted user the API accepts', async () => {
    maybeSingle.mockResolvedValue({data:{id:'access-1'},error:null});
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({allowed:true});
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect((await requireIntelUser(new NextRequest('http://localhost:3000/api/intel/companies',{headers:{authorization:'Bearer test-token'}}))).error).toBeUndefined();
  });
  it('rejects absent server cookies even if a browser might have a local session', async () => {
    getUser.mockResolvedValue({data:{user:null},error:null});
    expect((await GET()).status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
  it('returns actionable denial instead of redirecting back to login', async () => {
    const response = await GET(); expect(response.status).toBe(403);
    expect((await response.json()).error).toContain('enable Intel access');
  });
  it('reports a retryable access lookup failure', async () => {
    maybeSingle.mockResolvedValue({data:null,error:{message:'offline'}});
    expect((await GET()).status).toBe(503);
  });
});
