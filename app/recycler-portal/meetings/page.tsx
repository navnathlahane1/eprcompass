'use client';

import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Rule { day_of_week: number; start_time: string; end_time: string; }
interface Settings { timezone: string; meeting_duration_min: number; buffer_min: number; booking_enabled: boolean; }
interface Booking {
  id: string; booked_by_name: string; booked_by_email: string | null; booked_by_phone: string;
  booked_by_org: string | null; start_at: string; end_at: string; status: string; notes: string | null;
  requirement: { pibo_name: string } | null;
}

export default function MeetingsPage() {
  const [settings, setSettings] = useState<Settings>({ timezone: 'Asia/Kolkata', meeting_duration_min: 30, buffer_min: 10, booking_enabled: false });
  const [dayRules, setDayRules] = useState<Record<number, { enabled: boolean; start: string; end: string }>>(
    Object.fromEntries(DAYS.map((_, i) => [i, { enabled: false, start: '10:00', end: '18:00' }]))
  );
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [publicSlug, setPublicSlug] = useState<string | null>(null);
  const [publicEnabled, setPublicEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/recycler-portal/calendar-settings').then((r) => r.json()),
      fetch('/api/recycler-portal/bookings').then((r) => r.json()),
      fetch('/api/recycler-portal/reputation').then((r) => r.json()),
    ]).then(([cal, bk, rep]) => {
      if (cal.settings) setSettings(cal.settings);
      if (Array.isArray(cal.rules)) {
        const next = { ...dayRules };
        for (const r of cal.rules as Rule[]) {
          next[r.day_of_week] = { enabled: true, start: r.start_time.slice(0, 5), end: r.end_time.slice(0, 5) };
        }
        setDayRules(next);
      }
      setBookings(bk.bookings ?? []);
      setPublicSlug(rep.recycler?.public_slug ?? null);
      setPublicEnabled(!!rep.recycler?.public_profile_enabled);
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    setBanner('');
    try {
      const rules = Object.entries(dayRules)
        .filter(([, v]) => v.enabled)
        .map(([day, v]) => ({ day_of_week: Number(day), start_time: v.start, end_time: v.end }));

      const r = await fetch('/api/recycler-portal/calendar-settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, rules }),
      });
      const d = await r.json();
      if (r.ok) trackEvent('Recycler Meeting Settings Saved', {});
      setBanner(r.ok ? 'Saved.' : (d.error || 'Failed to save'));
    } finally {
      setSaving(false);
    }
  }

  const bookingLink = publicSlug ? `/r/${publicSlug}` : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meetings &amp; Booking Calendar</h1>
        <p className="text-sm text-gray-500 mt-1">Set your preferred times for meeting requests from your public profile. Visitors submit their details first, then the team contacts them to agree on a time.</p>
      </div>

      {!publicEnabled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your public profile is currently off, so buyers can&apos;t reach your booking page yet. Turn it on from <a href="/recycler-portal/reputation" className="underline font-medium">Reputation &amp; Profile</a>.
        </div>
      )}

      {loading ? (
        <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Enable Public Booking</p>
                <p className="text-xs text-gray-500">Show a booking widget on your public profile.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.booking_enabled} onChange={(e) => setSettings((s) => ({ ...s, booking_enabled: e.target.checked }))} className="sr-only peer" />
                <div className="w-10 h-5.5 h-6 bg-gray-200 rounded-full peer peer-checked:bg-teal-600 transition-colors relative">
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform ${settings.booking_enabled ? 'translate-x-4' : ''}`} />
                </div>
              </label>
            </div>

            {bookingLink && (
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <code className="text-xs text-gray-600 flex-1 truncate">{bookingLink}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(window.location.origin + bookingLink)}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 shrink-0"
                >
                  Copy Link
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Meeting Length (min)</label>
                <input type="number" value={settings.meeting_duration_min} onChange={(e) => setSettings((s) => ({ ...s, meeting_duration_min: Number(e.target.value) }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Buffer Between (min)</label>
                <input type="number" value={settings.buffer_min} onChange={(e) => setSettings((s) => ({ ...s, buffer_min: Number(e.target.value) }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Timezone</label>
                <input value={settings.timezone} onChange={(e) => setSettings((s) => ({ ...s, timezone: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Weekly Availability</p>
            {DAYS.map((label, i) => (
              <div key={i} className="flex items-center gap-3">
                <label className="flex items-center gap-2 w-32 shrink-0 text-sm text-gray-700">
                  <input type="checkbox" checked={dayRules[i].enabled} onChange={(e) => setDayRules((d) => ({ ...d, [i]: { ...d[i], enabled: e.target.checked } }))} className="accent-teal-600" />
                  {label}
                </label>
                <input type="time" disabled={!dayRules[i].enabled} value={dayRules[i].start} onChange={(e) => setDayRules((d) => ({ ...d, [i]: { ...d[i], start: e.target.value } }))} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm disabled:opacity-40" />
                <span className="text-gray-400 text-sm">to</span>
                <input type="time" disabled={!dayRules[i].enabled} value={dayRules[i].end} onChange={(e) => setDayRules((d) => ({ ...d, [i]: { ...d[i], end: e.target.value } }))} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm disabled:opacity-40" />
              </div>
            ))}
          </div>

          {banner && <div className="rounded-lg bg-teal-50 border border-teal-200 px-3 py-2 text-sm text-teal-700">{banner}</div>}
          <button onClick={save} disabled={saving} className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Calendar Settings'}
          </button>

          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Upcoming Bookings</p>
            {bookings.length === 0 ? (
              <p className="text-sm text-gray-500">No bookings yet.</p>
            ) : (
              <div className="space-y-2">
                {bookings.map((b) => (
                  <div key={b.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-semibold text-gray-900">{b.booked_by_name}{b.booked_by_org ? ` · ${b.booked_by_org}` : ''}</span>
                      <span className="text-xs text-gray-500">{new Date(b.start_at).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{b.booked_by_phone}{b.booked_by_email ? ` · ${b.booked_by_email}` : ''}</p>
                    {b.requirement?.pibo_name && <p className="text-xs text-teal-700 mt-0.5">Re: {b.requirement.pibo_name}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
