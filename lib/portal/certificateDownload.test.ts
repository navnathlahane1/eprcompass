import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const { actor, from, sign } = vi.hoisted(() => ({ actor: vi.fn(), from: vi.fn(), sign: vi.fn() }));
vi.mock('./clientAuth', () => ({ resolveClientActor: actor, adminClient: () => ({ from, storage: { from: () => ({ createSignedUrl: sign }) } }) }));
import { GET } from '@/app/api/portal/certificates/[id]/download/route';
const id = '11111111-1111-4111-8111-111111111111';
const request = new NextRequest(`http://localhost:3000/api/portal/certificates/${id}/download`);
function query(data: object | null, error: object | null = null) {
  const q: any = { select: vi.fn(() => q), eq: vi.fn(() => q), ilike: vi.fn(() => q), maybeSingle: vi.fn(async () => ({ data, error })) };
  return q;
}
beforeEach(() => {
  vi.clearAllMocks();
  actor.mockResolvedValue({ clientId: 'company-a', memberRole: 'VIEWER' });
  sign.mockResolvedValue({ data: { signedUrl: 'https://storage.example/download?token=test' }, error: null });
});
describe('certificate download access', () => {
  it('uses active membership scope and private short-lived links', async () => {
    const q = query({ file_path: 'company-a/certificate/file.pdf' });
    from.mockReturnValue(q);
    const response = await GET(request, { params: Promise.resolve({ id }) });
    expect(response.status).toBe(303);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(q.eq).toHaveBeenCalledWith('client_id', 'company-a');
    expect(sign).toHaveBeenCalledWith('company-a/certificate/file.pdf', 60, { download: true });
  });
  it('does not sign missing or unrelated certificates', async () => {
    from.mockReturnValue(query(null));
    expect((await GET(request, { params: Promise.resolve({ id }) })).status).toBe(404);
    expect(sign).not.toHaveBeenCalled();
  });
  it.each(['company-b/file.pdf', 'company-a/../file.pdf', 'https://external.example/file.pdf'])('rejects unsafe legacy path %s', async file_path => {
    from.mockReturnValue(query({ file_path }));
    expect((await GET(request, { params: Promise.resolve({ id }) })).status).toBe(409);
    expect(sign).not.toHaveBeenCalled();
  });
  it('rejects suspended or unauthenticated actors', async () => {
    actor.mockResolvedValue(null);
    expect((await GET(request, { params: Promise.resolve({ id }) })).status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
  it('reports signing failure without a broken link', async () => {
    from.mockReturnValue(query({ file_path: 'company-a/file.pdf' }));
    sign.mockResolvedValue({ error: { message: 'offline' } });
    expect((await GET(request, { params: Promise.resolve({ id }) })).status).toBe(503);
  });
});
