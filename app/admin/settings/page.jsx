"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const SETTINGS_KEY = 'admin.panel.settings.v1';
const EARLYBIRD_KEY = 'checkout.earlybird_end';

// Convert ISO with timezone offset → value usable by <input type="datetime-local"> (local clock).
function isoToDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminSettingsPage() {
  const [userEmail, setUserEmail] = useState('');
  const [settings, setSettings] = useState({
    autoRefresh: true,
    defaultDateRange: '30days',
    alertEmail: true,
    alertCriticalOnly: false
  });
  const [saved, setSaved] = useState(false);
  const [earlyBirdValue, setEarlyBirdValue] = useState('');
  const [earlyBirdStatus, setEarlyBirdStatus] = useState(null);
  const [earlyBirdSaving, setEarlyBirdSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email || '');
    });

    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Ignore bad local state and continue with defaults.
    }

    fetch('/api/admin/site-settings')
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((data) => {
        const row = (data.rows || []).find((r) => r.key === EARLYBIRD_KEY);
        if (row?.value) setEarlyBirdValue(isoToDatetimeLocal(row.value));
      })
      .catch(() => {});
  }, []);

  const saveEarlyBird = async () => {
    if (!earlyBirdValue) {
      setEarlyBirdStatus({ type: 'error', message: 'Pick a date and time first.' });
      return;
    }
    setEarlyBirdSaving(true);
    setEarlyBirdStatus(null);
    try {
      const iso = new Date(earlyBirdValue).toISOString();
      const res = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: EARLYBIRD_KEY, value: iso }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save');
      setEarlyBirdStatus({ type: 'success', message: 'Saved.' });
    } catch (err) {
      setEarlyBirdStatus({ type: 'error', message: err.message || 'Save failed' });
    } finally {
      setEarlyBirdSaving(false);
    }
  };

  const onChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const onSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800">
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 mt-1">Configure admin panel behavior and alert preferences.</p>
      </div>

      <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800">
        <h2 className="text-lg font-semibold text-slate-100 mb-3">Account</h2>
        <p className="text-sm text-slate-400">Signed in as</p>
        <p className="font-medium text-slate-100 mt-1">{userEmail || 'Unknown user'}</p>
      </div>

      <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800 space-y-5">
        <h2 className="text-lg font-semibold text-slate-100">Panel Preferences</h2>

        <label className="flex items-center justify-between border rounded-lg p-3">
          <div>
            <p className="font-medium text-slate-100">Auto refresh dashboards</p>
            <p className="text-sm text-slate-500">Refresh module data periodically.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.autoRefresh}
            onChange={(e) => onChange('autoRefresh', e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <label className="block">
          <p className="font-medium text-slate-100 mb-2">Default analytics date range</p>
          <select
            value={settings.defaultDateRange}
            onChange={(e) => onChange('defaultDateRange', e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="12months">Last 12 months</option>
          </select>
        </label>

        <label className="flex items-center justify-between border rounded-lg p-3">
          <div>
            <p className="font-medium text-slate-100">Email alerts</p>
            <p className="text-sm text-slate-500">Receive alerts by email.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.alertEmail}
            onChange={(e) => onChange('alertEmail', e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <label className="flex items-center justify-between border rounded-lg p-3">
          <div>
            <p className="font-medium text-slate-100">Critical alerts only</p>
            <p className="text-sm text-slate-500">Filter alert notifications to high priority only.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.alertCriticalOnly}
            onChange={(e) => onChange('alertCriticalOnly', e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            onClick={onSave}
            className="btn-primary"
          >
            Save Settings
          </button>
          {saved && <span className="text-sm text-emerald-300">Saved successfully.</span>}
        </div>
      </div>

      <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Promotions</h2>
          <p className="text-sm text-slate-500 mt-1">Controls the early-bird countdown shown on the public checkout page.</p>
        </div>
        <label className="block">
          <span className="font-medium text-slate-100 block mb-2">Early-bird end (local time)</span>
          <input
            type="datetime-local"
            value={earlyBirdValue}
            onChange={(e) => { setEarlyBirdValue(e.target.value); setEarlyBirdStatus(null); }}
            className="w-full max-w-sm border rounded-lg px-3 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={saveEarlyBird}
            disabled={earlyBirdSaving}
            aria-busy={earlyBirdSaving}
            className="btn-primary"
          >
            {earlyBirdSaving ? 'Saving…' : 'Save promotion date'}
          </button>
          {earlyBirdStatus ? (
            <span
              role="status"
              aria-live="polite"
              className={`text-sm ${earlyBirdStatus.type === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}
            >
              {earlyBirdStatus.message}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
