'use client';

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const PLATFORM_OPTIONS = ['Zoom', 'Google Meet', 'Offline'];

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function buildMonthGrid(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const first = new Date(y, m, 1);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startWeekDay = first.getDay();

  const cells: Array<{ date: Date | null }> = [];
  for (let i = 0; i < startWeekDay; i += 1) cells.push({ date: null });
  for (let day = 1; day <= daysInMonth; day += 1) cells.push({ date: new Date(y, m, day) });
  while (cells.length % 7 !== 0) cells.push({ date: null });
  return cells;
}

export default function SessionsClient({ initialPrograms, initialSessions }: { initialPrograms: any[]; initialSessions: any[] }) {
  const [programs] = useState(initialPrograms || []);
  const [sessions, setSessions] = useState(initialSessions || []);
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [form, setForm] = useState({
    program_id: initialPrograms?.[0]?.id || '',
    session_date: toDateKey(new Date()),
    start_time: '10:00',
    end_time: '11:00',
    timezone: 'Asia/Kolkata',
    platform: 'Zoom',
    meeting_link: '',
    venue: '',
    seats_total: 100,
    status: 'Scheduled'
  });

  const monthGrid = useMemo(() => buildMonthGrid(month), [month]);

  const countsByDate = useMemo(() => {
    const map = new Map<string, number>();
    (sessions || []).forEach((row) => {
      const key = row.session_date;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [sessions]);

  const selectedSessions = useMemo(() => {
    return (sessions || []).filter((row) => row.session_date === selectedDate);
  }, [sessions, selectedDate]);

  async function addSession(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        program_id: form.program_id,
        session_date: form.session_date,
        start_time: form.start_time,
        end_time: form.end_time,
        timezone: form.timezone,
        platform: form.platform,
        meeting_link: form.meeting_link || null,
        venue: form.venue || null,
        seats_total: Number(form.seats_total || 0),
        status: form.status
      };

      const { data, error } = await (supabase as any)
        .from('training_sessions')
        .insert(payload)
        .select('id, program_id, session_date, start_time, end_time, timezone, platform, meeting_link, venue, seats_total, seats_booked, status, created_at, training_programs(title)')
        .single();

      if (error) throw error;
      setSessions((prev) => [...prev, data].sort((a, b) => `${a.session_date} ${a.start_time}`.localeCompare(`${b.session_date} ${b.start_time}`)));
      setSelectedDate(form.session_date);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(row: any) {
    setEditingId(row.id);
    setEditForm({
      start_time: row.start_time?.slice(0, 5) || '',
      end_time: row.end_time?.slice(0, 5) || '',
      platform: row.platform,
      meeting_link: row.meeting_link || '',
      venue: row.venue || '',
      seats_total: row.seats_total,
      status: row.status
    });
  }

  async function saveEdit(rowId: string) {
    const { error } = await (supabase as any)
      .from('training_sessions')
      .update({
        start_time: editForm.start_time,
        end_time: editForm.end_time,
        platform: editForm.platform,
        meeting_link: editForm.meeting_link || null,
        venue: editForm.venue || null,
        seats_total: Number(editForm.seats_total || 0),
        status: editForm.status
      })
      .eq('id', rowId);

    if (error) return;

    setSessions((prev) => prev.map((row) => (row.id === rowId ? { ...row, ...editForm } : row)));
    setEditingId(null);
    setEditForm({});
  }

  async function cancelSession(rowId: string) {
    const { error } = await (supabase as any)
      .from('training_sessions')
      .update({ status: 'Cancelled' })
      .eq('id', rowId);

    if (error) return;

    setSessions((prev) => prev.map((row) => (row.id === rowId ? { ...row, status: 'Cancelled' } : row)));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">Academy Sessions</h1>
        <p className="mt-1 text-sm text-slate-400">Month grid calendar with inline session management.</p>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Add Session</h2>
        <form onSubmit={addSession} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <select required value={form.program_id} onChange={(e) => setForm((p) => ({ ...p, program_id: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
            {programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <input required type="date" value={form.session_date} onChange={(e) => setForm((p) => ({ ...p, session_date: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          <input required type="time" value={form.start_time} onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          <input required type="time" value={form.end_time} onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          <select value={form.platform} onChange={(e) => setForm((p) => ({ ...p, platform: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
            {PLATFORM_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input type="number" value={form.seats_total} onChange={(e) => setForm((p) => ({ ...p, seats_total: Number(e.target.value) }))} placeholder="Seats" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          <input value={form.meeting_link} onChange={(e) => setForm((p) => ({ ...p, meeting_link: e.target.value }))} placeholder="Meeting Link" className="rounded-md border border-slate-700 px-3 py-2 text-sm md:col-span-2" />
          <input value={form.venue} onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))} placeholder="Venue" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />

          <button disabled={saving} className="btn-primary md:col-span-3">
            {saving ? 'Saving...' : 'Add Session'}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">{monthLabel(month)}</h2>
          <div className="flex gap-2">
            <button onClick={() => setMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="rounded-md border border-slate-700 px-2 py-1 text-xs">Prev</button>
            <button onClick={() => setMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="rounded-md border border-slate-700 px-2 py-1 text-xs">Next</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day}>{day}</div>)}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {monthGrid.map((cell, idx) => {
            if (!cell.date) {
              return <div key={`empty-${idx}`} className="h-20 rounded-md border border-transparent bg-slate-950" />;
            }

            const key = toDateKey(cell.date);
            const count = countsByDate.get(key) || 0;
            const selected = key === selectedDate;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(key)}
                className={`h-20 rounded-md border p-2 text-left ${selected ? 'border-blue-500 bg-blue-950/30' : 'border-slate-800 bg-slate-900/60 hover:bg-slate-950'}`}
              >
                <p className="text-xs font-semibold text-slate-200">{cell.date.getDate()}</p>
                {count > 0 ? <span className="mt-2 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">{count} sessions</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Sessions on {selectedDate}</h2>
        <div className="mt-3 space-y-3">
          {selectedSessions.map((row) => (
            <article key={row.id} className="rounded-lg border border-slate-800 p-3">
              <p className="text-sm font-semibold text-slate-100">{row.training_programs?.title || 'Program'}</p>
              {editingId === row.id ? (
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                  <input type="time" value={editForm.start_time || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, start_time: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
                  <input type="time" value={editForm.end_time || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, end_time: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
                  <select value={editForm.platform || 'Zoom'} onChange={(e) => setEditForm((p: any) => ({ ...p, platform: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
                    {PLATFORM_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <input value={editForm.meeting_link || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, meeting_link: e.target.value }))} placeholder="Meeting Link" className="rounded-md border border-slate-700 px-3 py-2 text-sm md:col-span-2" />
                  <input value={editForm.venue || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, venue: e.target.value }))} placeholder="Venue" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
                  <input type="number" value={editForm.seats_total || 0} onChange={(e) => setEditForm((p: any) => ({ ...p, seats_total: Number(e.target.value) }))} placeholder="Seats" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
                  <select value={editForm.status || 'Scheduled'} onChange={(e) => setEditForm((p: any) => ({ ...p, status: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
                    {['Scheduled', 'Live', 'Completed', 'Cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>

                  <div className="md:col-span-3 flex gap-2">
                    <button onClick={() => saveEdit(row.id)} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Save</button>
                    <button onClick={() => setEditingId(null)} className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-950">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-1 text-xs text-slate-400">{row.start_time?.slice(0, 5)} - {row.end_time?.slice(0, 5)} | {row.platform} | Seats {row.seats_booked}/{row.seats_total}</p>
                  <p className="text-xs text-slate-400">Status: {row.status}</p>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => startEdit(row)} className="rounded-md border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-950">Edit</button>
                    <button onClick={() => cancelSession(row.id)} className="rounded-md border border-rose-700/50 px-2 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-950/30">Cancel Session</button>
                  </div>
                </>
              )}
            </article>
          ))}
          {selectedSessions.length === 0 ? <p className="text-sm text-slate-500">No sessions for this day.</p> : null}
        </div>
      </section>
    </div>
  );
}
