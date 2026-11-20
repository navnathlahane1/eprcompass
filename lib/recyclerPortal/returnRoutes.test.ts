import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const { actor, from } = vi.hoisted(() => ({ actor: vi.fn(), from: vi.fn() }));
vi.mock('./recyclerAuth', () => ({ resolveRecyclerActor: actor, adminClient: () => ({ from }) }));
import { GET, POST } from '@/app/api/recycler-portal/cpcb-returns/route';
import { GET as prepare } from '@/app/api/recycler-portal/cpcb-returns/prep/route';
import { validDate, validReturnQuantity } from './returnValidation';

function query(result: object) {
  const q: any = {};
  for (const method of ['select', 'eq', 'in', 'gte', 'lte', 'order', 'insert']) q[method] = vi.fn(() => q);
  q.single = vi.fn(async () => result);
  q.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return q;
}
const body = { return_label: 'Q1', period_start: '2026-04-01', period_end: '2026-06-30', processed_qty_mt: 0 };
function request(data: object) {
  return new NextRequest('http://localhost:3000/api/recycler-portal/cpcb-returns', { method: 'POST', headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' }, body: JSON.stringify(data) });
}
beforeEach(() => { vi.clearAllMocks(); actor.mockResolvedValue({ recyclerId: 'recycler-a' }); });

describe('return persistence', () => {
  it('does not mask missing schema as an empty successful list', async () => {
    from.mockReturnValue(query({ data: null, error: { code: '42P01' } }));
    expect((await GET()).status).toBe(503);
  });
  it('does not acknowledge a failed insert', async () => {
    from.mockReturnValue(query({ data: null, error: { code: '42P01' } }));
    const response = await POST(request(body));
    expect(response.status).toBe(503);
    expect((await response.json()).return).toBeUndefined();
  });
  it('persists zero quantities and derives recycler identity from the actor', async () => {
    const q = query({ data: { id: 'saved' }, error: null });
    from.mockReturnValue(q);
    expect((await POST(request({ ...body, recycler_id: 'other' }))).status).toBe(201);
    expect(q.insert).toHaveBeenCalledWith(expect.objectContaining({ recycler_id: 'recycler-a', processed_qty_mt: 0 }));
  });
  it.each([{ period_end: '2026-02-30' }, { period_end: '2026-01-01' }, { processed_qty_mt: -1 }, { return_label: 42 }])('rejects invalid values %o', async invalid => {
    expect((await POST(request({ ...body, ...invalid }))).status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });
  it('requires authentication', async () => {
    actor.mockResolvedValue(null);
    expect((await POST(request(body))).status).toBe(401);
  });
});

describe('return preparation', () => {
  it('reports source failure instead of zero totals', async () => {
    from.mockReturnValue(query({ error: { message: 'offline' }, data: null }));
    expect((await prepare(new NextRequest('http://localhost:3000/api/prep?from=2026-04-01&to=2026-06-30'))).status).toBe(503);
  });
  it('excludes disputed/expired credits and applies recycler scope', async () => {
    const tonnage = query({ data: [{ utilized_mt: 12 }], error: null });
    const credits = query({ data: [{ quantity_mt: 8, waste_category: 'Plastic' }], error: null });
    from.mockReturnValueOnce(tonnage).mockReturnValueOnce(credits);
    const response = await prepare(new NextRequest('http://localhost:3000/api/prep?from=2026-04-01&to=2026-06-30'));
    expect(response.status).toBe(200);
    expect(credits.in).toHaveBeenCalledWith('status', ['Issued', 'Listed', 'Transferred', 'Used']);
    expect(credits.eq).toHaveBeenCalledWith('recycler_id', 'recycler-a');
    expect(await response.json()).toMatchObject({ processed_qty_mt: 12, credits_issued_mt: 8 });
  });
  it('rejects partial months instead of overstating processed mass', async () => {
    expect((await prepare(new NextRequest('http://localhost:3000/api/prep?from=2026-04-15&to=2026-06-30'))).status).toBe(400);
  });
  it('validates dates and quantities strictly', () => {
    expect(validDate('2026-02-30')).toBe(false);
    expect(validDate('2024-02-29')).toBe(true);
    expect(validReturnQuantity(true)).toBe(false);
    expect(validReturnQuantity('Infinity')).toBe(false);
  });
});
