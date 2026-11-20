import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { actor, update, eq, maybeSingle } = vi.hoisted(() => ({ actor: vi.fn(), update: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() }));
vi.mock('@/lib/portal/clientAuth', () => ({ resolveClientActor: actor, adminClient: () => ({ from: () => ({ update }) }) }));
import { PUT } from '../../app/api/portal/onboarding/route';
const valid = { business_activity: 'both', operating_countries: ['India'], product_categories: ['Plastic'], imported_products: 'Packaging', manufactured_products: 'Containers' };
const request = (body: unknown = valid) => new NextRequest('http://localhost:3000/api/portal/onboarding', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.clearAllMocks();
  actor.mockResolvedValue({ userId: 'owner', clientId: 'own-company', memberRole: 'OWNER' });
  const chain = { eq, select: () => ({ maybeSingle }) };
  update.mockReturnValue(chain); eq.mockReturnValue(chain);
  maybeSingle.mockResolvedValue({ data: { id: 'own-company' }, error: null });
});
describe('client setup authorization', () => {
  it('saves incomplete drafts without marking them complete', async () => {
    const response = await PUT(request({ ...valid, mode: 'draft', operating_countries: [], product_categories: [], imported_products: '', manufactured_products: '', setup_status: 'complete' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ saved: true, setup_status: 'draft' });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ onboarding_details: expect.objectContaining({ setup_status: 'draft' }) }));
  });
  it('rejects unknown save modes', async () => {
    expect((await PUT(request({ ...valid, mode: 'approved' }))).status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });
  it('requires authentication', async () => {
    actor.mockResolvedValue(null);
    expect((await PUT(request())).status).toBe(401);
    expect(update).not.toHaveBeenCalled();
  });
  it('rejects team-member writes', async () => {
    actor.mockResolvedValue({ memberRole: 'MANAGER' });
    expect((await PUT(request())).status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });
  it('scopes persistence to the authenticated company and owner', async () => {
    expect((await PUT(request({ ...valid, ...{ clientId: 'other', profile_id: 'other', plan_code: 'enterprise' } }))).status).toBe(200);
    expect(eq).toHaveBeenCalledWith('id', 'own-company');
    expect(eq).toHaveBeenCalledWith('profile_id', 'owner');
    expect(update).toHaveBeenCalledWith({ business_activity: 'both', onboarding_details: { operating_countries: ['India'], product_categories: ['Plastic'], imported_products: 'Packaging', manufactured_products: 'Containers', setup_status: 'complete' } });
  });
  it('rejects invalid company types without writing', async () => {
    expect((await PUT(request({ ...valid, business_activity: 'enterprise' }))).status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });
  it('does not report a missing owner row as saved', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await PUT(request())).status).toBe(404);
  });
});
