'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const ACTIVITY_TYPES = ['Call', 'Email', 'WhatsApp', 'Meeting', 'LinkedIn', 'Contract', 'Referral'];

/**
 * @param {{
 *   entityType: string,
 *   entityId: string,
 *   currentUserId?: string | null,
 *   initialActivities?: any[]
 * }} props
 */
export default function ActivityFeed({
  entityType,
  entityId,
  currentUserId,
  initialActivities = /** @type {any[]} */ ([])
}) {
  const [items, setItems] = useState(initialActivities);
  const [typeFilter, setTypeFilter] = useState('All');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'Call', note: '', outcome: '' });

  useEffect(() => {
    const channel = supabase
      .channel(`activity-feed-${entityType}-${entityId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, (payload) => {
        const row = payload.new || payload.old;
        if (!row) return;
        if (row.entity_type !== entityType || row.entity_id !== entityId) return;

        if (payload.eventType === 'INSERT' && payload.new) {
          setItems((prev) => (prev.some((i) => i.id === payload.new.id) ? prev : [payload.new, ...prev]));
        }

        if (payload.eventType === 'UPDATE' && payload.new) {
          setItems((prev) => prev.map((i) => (i.id === payload.new.id ? { ...i, ...payload.new } : i)));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityId, entityType]);

  const filtered = useMemo(() => {
    return (items || []).filter((i) => typeFilter === 'All' || i.type === typeFilter);
  }, [items, typeFilter]);

  async function logActivity(event) {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        entity_type: entityType,
        entity_id: entityId,
        type: form.type,
        note: form.note || null,
        outcome: form.outcome || null,
        done_by: currentUserId || null
      };

      const { data, error } = await supabase
        .from('activities')
        .insert(payload)
        .select('id, entity_type, entity_id, type, note, outcome, done_by, created_at')
        .single();

      if (error) throw error;

      setItems((prev) => [data, ...prev]);
      setForm({ type: 'Call', note: '', outcome: '' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <form onSubmit={logActivity} className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900">Log Activity</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          >
            {ACTIVITY_TYPES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <input
            value={form.outcome}
            onChange={(e) => setForm((p) => ({ ...p, outcome: e.target.value }))}
            placeholder="Outcome"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Activity'}
          </button>
        </div>

        <textarea
          value={form.note}
          onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
          placeholder="Add note"
          className="mt-3 min-h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        />
      </form>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Activity Timeline</h3>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900"
          >
            <option value="All">All Types</option>
            {ACTIVITY_TYPES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-semibold text-gray-700">{item.type}</span>
                <span>{new Date(item.created_at).toLocaleString()}</span>
              </div>
              {item.note ? <p className="mt-2 text-sm text-gray-700">{item.note}</p> : null}
              {item.outcome ? <p className="mt-1 text-xs text-gray-600">Outcome: {item.outcome}</p> : null}
            </article>
          ))}

          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
              No recycler activity found.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
