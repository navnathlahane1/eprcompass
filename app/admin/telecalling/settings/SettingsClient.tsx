'use client';

import { useState, useEffect } from 'react';
import DesktopCallingSection from './DesktopCallingSection';

const EXOTEL_KEYS = [
  { key: 'exotel_account_sid', label: 'Account SID', sensitive: false },
  { key: 'exotel_api_key', label: 'API Key', sensitive: true },
  { key: 'exotel_api_token', label: 'API Token', sensitive: true },
  { key: 'exotel_caller_id', label: 'Caller ID (Virtual Number)', sensitive: false },
  { key: 'exotel_subdomain', label: 'Subdomain (e.g. myapp.exotel.in)', sensitive: false },
];

const OTHER_KEYS = [
  { key: 'anthropic_api_key', label: 'Anthropic API Key', sensitive: true },
  { key: 'anthropic_model', label: 'Anthropic Model', sensitive: false },
  { key: 'enrichment_prompt_template', label: 'AI Enrichment Prompt Template', multiline: true },
  { key: 'exotel_webhook_secret', label: 'Webhook Secret', sensitive: true },
];

const ANTHROPIC_MODEL_OPTIONS = [
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (latest)' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (20250514)' },
  { value: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet (latest)' },
  { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet (latest)' },
];

export default function SettingsClient() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/admin/telecalling/settings')
      .then(r => r.json())
      .then(d => { setSettings(d.settings || {}); setEdits(d.settings || {}); setLoading(false); });
  }, []);

  function getWebhookUrl() {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/api/admin/telecalling/exotel-webhook?secret=${edits['exotel_webhook_secret'] || '[WEBHOOK_SECRET]'}`;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const changed: Record<string, string> = {};
    for (const [key, val] of Object.entries(edits)) {
      if (val !== (settings[key] || '') && !val.includes('****')) {
        changed[key] = val;
      }
    }
    if (Object.keys(changed).length > 0) {
      await fetch('/api/admin/telecalling/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ settings: changed }),
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div className="text-center py-10 text-slate-500">Loading settings…</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-slate-100 mb-6">Settings</h1>

      <form onSubmit={save} className="space-y-8">
        {/* Exotel */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
          <h2 className="font-semibold text-slate-100 mb-1">Exotel Configuration</h2>
          <p className="text-xs text-slate-500 mb-5">Enter values to override environment variables. Leave blank to use env vars.</p>
          <div className="space-y-4">
            {EXOTEL_KEYS.map(({ key, label, sensitive }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                <input
                  type={sensitive ? 'password' : 'text'}
                  value={edits[key] || ''}
                  onChange={e => setEdits(ed => ({ ...ed, [key]: e.target.value }))}
                  placeholder={sensitive ? '(stored — enter to change)' : ''}
                  className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
                />
              </div>
            ))}
          </div>

          <div className="mt-5 p-3 bg-slate-950 rounded-lg">
            <div className="text-xs font-medium text-slate-400 mb-1">Webhook URL</div>
            <code className="text-xs text-slate-200 break-all">{getWebhookUrl()}</code>
            <p className="text-xs text-slate-500 mt-1">Paste this URL in your Exotel account&apos;s passthru URL setting.</p>
          </div>
        </div>

        <DesktopCallingSection />

        {/* Enrichment prompt */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
          <h2 className="font-semibold text-slate-100 mb-1">AI Enrichment</h2>
          <p className="text-xs text-slate-500 mb-5">
            Prompt template for Claude. Use <code className="bg-slate-900 px-1 rounded">{'{{company_name}}'}</code>, <code className="bg-slate-900 px-1 rounded">{'{{state}}'}</code> etc. as placeholders.
          </p>
          {OTHER_KEYS.filter(k => k.key === 'anthropic_model').map(({ key, label }) => (
            <div key={key} className="mb-4">
              <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
              <select
                value={edits[key] || ''}
                onChange={e => setEdits(ed => ({ ...ed, [key]: e.target.value }))}
                className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
              >
                <option value="">Auto</option>
                {ANTHROPIC_MODEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Leave as Auto to use the environment setting, otherwise pick a model supported by your Anthropic account.
              </p>
            </div>
          ))}
          {OTHER_KEYS.filter(k => k.key === 'anthropic_api_key').map(({ key, label, sensitive }) => (
            <div key={key} className="mb-4">
              <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
              <input
                type={sensitive ? 'password' : 'text'}
                value={edits[key] || ''}
                onChange={e => setEdits(ed => ({ ...ed, [key]: e.target.value }))}
                placeholder="(stored — enter to change)"
                className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
              />
            </div>
          ))}
          {OTHER_KEYS.filter(k => k.key === 'enrichment_prompt_template').map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
              <textarea
                rows={10}
                value={edits[key] || ''}
                onChange={e => setEdits(ed => ({ ...ed, [key]: e.target.value }))}
                className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono bg-slate-900/60 text-slate-100"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {saved && <span className="text-sm text-emerald-400">Saved</span>}
        </div>
      </form>
    </div>
  );
}
