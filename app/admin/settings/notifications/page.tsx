'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'admin.notifications.settings.v1';

type NotificationSettings = {
  emailEnabled: boolean;
  browserEnabled: boolean;
  deadlinesEnabled: boolean;
  billingEnabled: boolean;
  marketplaceEnabled: boolean;
  dailyDigest: boolean;
};

const defaultSettings: NotificationSettings = {
  emailEnabled: true,
  browserEnabled: true,
  deadlinesEnabled: true,
  billingEnabled: true,
  marketplaceEnabled: true,
  dailyDigest: false
};

export default function AdminNotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<NotificationSettings>;
      setSettings((prev) => ({ ...prev, ...parsed }));
    } catch {
      // Ignore malformed local data and continue with defaults.
    }
  }, []);

  function updateSetting<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-bold text-slate-100">Notification Settings</h1>
        <p className="mt-1 text-slate-400">
          Choose how you want to receive admin alerts and workflow updates.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Channels</h2>

        <label className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="font-medium text-slate-100">Email notifications</p>
            <p className="text-sm text-slate-500">Receive updates in your inbox.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.emailEnabled}
            onChange={(e) => updateSetting('emailEnabled', e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="font-medium text-slate-100">Browser notifications</p>
            <p className="text-sm text-slate-500">Show real-time alerts in this browser.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.browserEnabled}
            onChange={(e) => updateSetting('browserEnabled', e.target.checked)}
            className="h-4 w-4"
          />
        </label>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Alert Types</h2>

        <label className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="font-medium text-slate-100">Compliance deadlines</p>
            <p className="text-sm text-slate-500">Due dates, overdue filings, and renewal reminders.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.deadlinesEnabled}
            onChange={(e) => updateSetting('deadlinesEnabled', e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="font-medium text-slate-100">Billing and payment alerts</p>
            <p className="text-sm text-slate-500">Invoice creation, payment status, and overdue reminders.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.billingEnabled}
            onChange={(e) => updateSetting('billingEnabled', e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="font-medium text-slate-100">Marketplace activity</p>
            <p className="text-sm text-slate-500">Listing approvals, transactions, and risk flags.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.marketplaceEnabled}
            onChange={(e) => updateSetting('marketplaceEnabled', e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="font-medium text-slate-100">Daily digest</p>
            <p className="text-sm text-slate-500">One summary notification each day.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.dailyDigest}
            onChange={(e) => updateSetting('dailyDigest', e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            onClick={saveSettings}
            className="btn-primary"
          >
            Save Notification Settings
          </button>
          {saved ? <span className="text-sm text-emerald-300">Saved successfully.</span> : null}
        </div>
      </section>
    </div>
  );
}
