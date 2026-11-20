import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { actor, from } = vi.hoisted(() => ({ actor: vi.fn(), from: vi.fn() }));
vi.mock('./clientAuth', () => ({ resolveClientActor: actor, adminClient: () => ({ from }) }));
import { GET as hub } from '@/app/api/portal/compliance-hub/route';
import { GET as calendar } from '@/app/api/portal/compliance-hub/calendar/route';
import { GET as deadlines } from '@/app/api/portal/compliance-hub/deadlines/route';
import { GET as tasks, PATCH } from '@/app/api/portal/compliance-hub/tasks/route';

const id = '11111111-1111-4111-8111-111111111111';
const request = (path = '', body?: unknown) => new NextRequest(`http://localhost:3000/api/portal/compliance-hub/${path}`, body === undefined ? undefined : {
  method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
function query(data: unknown = [], error: unknown = null) {
  const q: any = { then: (resolve: (result: unknown) => unknown) => Promise.resolve({ data, error }).then(resolve) };
  for (const method of ['select', 'eq', 'not', 'order', 'limit', 'in', 'gte', 'lte', 'update', 'maybeSingle']) q[method] = vi.fn(() => q);
  return q;
}
beforeEach(() => {
  vi.clearAllMocks();
  actor.mockResolvedValue({ userId: 'member-a', clientId: 'company-a', memberRole: 'COMPLIANCE' });
  from.mockImplementation(() => query());
});

describe('client compliance reads', () => {
  it.each([hub, calendar, deadlines, tasks])('rejects unavailable membership before querying', async handler => {
    actor.mockResolvedValue(null);
    expect((await handler(request())).status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
  it.each([hub, calendar, deadlines, tasks])('scopes team member data without an owner-only lookup', async handler => {
    const q = query(); from.mockReturnValue(q);
    const response = await handler(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(q.eq).toHaveBeenCalledWith('client_id', 'company-a');
    expect(from).not.toHaveBeenCalledWith('clients');
  });
  it('limits notifications to their intended recipient', async () => {
    const q = query(); from.mockReturnValue(q);
    await hub();
    expect(q.eq).toHaveBeenCalledWith('recipient_id', 'member-a');
  });
  it.each([hub, calendar, deadlines, tasks])('does not turn database failure into empty success', async handler => {
    from.mockReturnValue(query(null, { message: 'internal database detail' }));
    const response = await handler(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('internal database detail');
  });
  it.each([calendar, deadlines, hub])('does not infer pending filings when their query fails', async handler => {
    from.mockImplementation((table: string) => table === 'client_compliances' ? query([{ id, framework_id: id }])
      : table === 'compliance_deadlines' ? query([{ id, framework_id: id, due_date: '2026-09-30' }])
        : table === 'client_compliance_filings' ? query(null, { message: 'offline' }) : query());
    expect((await handler(request())).status).toBe(503);
  });
  it.each(['month=0', 'month=13', 'month=2junk', 'year=NaN', 'year=1999'])('rejects invalid calendar range %s', async params => {
    expect((await calendar(request(`calendar?${params}`))).status).toBe(400);
  });
  it('uses exact UTC calendar boundaries including leap years', async () => {
    const q = query(); from.mockReturnValue(q);
    expect((await calendar(request('calendar?year=2024&month=2'))).status).toBe(200);
    expect(q.gte).toHaveBeenCalledWith('due_date', '2024-02-01');
    expect(q.lte).toHaveBeenCalledWith('due_date', '2024-02-29');
  });
  it.each(['NaN', '0', '-1', '367', '1bad'])('rejects invalid deadline lookahead %s', async days => {
    expect((await deadlines(request(`deadlines?upcoming=${days}`))).status).toBe(400);
  });
});

describe('staff-controlled task lifecycle', () => {
  it.each(['VIEWER', 'FINANCE'])('denies %s writes', async memberRole => {
    actor.mockResolvedValue({ clientId: 'company-a', memberRole });
    expect((await PATCH(request('tasks', { id, notes: 'hello' }))).status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });
  it.each([{ status: 'completed' }, { notes: 12 }, { client_id: 'company-b' }, { notes: 'x'.repeat(10001) }])('rejects invalid or staff-only changes', async change => {
    expect((await PATCH(request('tasks', { id, ...change }))).status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });
  it('rejects cross-site writes', async () => {
    const req = request('tasks', { id, notes: 'hello' }); req.headers.set('origin', 'https://elsewhere.example');
    expect((await PATCH(req)).status).toBe(403);
    expect(actor).not.toHaveBeenCalled();
  });
  it.each(['completed', 'waived', 'blocked'])('does not reopen %s tasks', async status => {
    const q = query({ id, status }); from.mockReturnValue(q);
    expect((await PATCH(request('tasks', { id, status: 'in_progress' }))).status).toBe(409);
    expect(q.update).not.toHaveBeenCalled();
  });
  it('cannot update an unrelated company task', async () => {
    const q = query(null); from.mockReturnValue(q);
    expect((await PATCH(request('tasks', { id, notes: 'hello' }))).status).toBe(404);
    expect(q.eq).toHaveBeenCalledWith('client_id', 'company-a');
    expect(q.update).not.toHaveBeenCalled();
  });
  it('checks scope and revision on the write itself', async () => {
    const read = query({ id, status: 'pending', updated_at: '2026-09-12T00:00:00Z' });
    const write = query({ id, status: 'in_progress' });
    from.mockReturnValueOnce(read).mockReturnValueOnce(write);
    expect((await PATCH(request('tasks', { id, status: 'in_progress' }))).status).toBe(200);
    expect(write.eq).toHaveBeenCalledWith('client_id', 'company-a');
    expect(write.eq).toHaveBeenCalledWith('status', 'pending');
    expect(write.eq).toHaveBeenCalledWith('updated_at', '2026-09-12T00:00:00Z');
    expect(write.update).toHaveBeenCalledWith({ status: 'in_progress' });
  });
  it('reports concurrent changes instead of falsely confirming success', async () => {
    from.mockReturnValueOnce(query({ id, status: 'pending', updated_at: '2026-09-12T00:00:00Z' })).mockReturnValueOnce(query(null));
    expect((await PATCH(request('tasks', { id, notes: 'hello' }))).status).toBe(409);
  });
});
