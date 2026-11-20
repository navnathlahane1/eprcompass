'use client';

import { useEffect, useMemo, useState } from 'react';

type IntegrationName = 'Razorpay' | 'Zoho CRM' | 'WhatsApp Business API' | 'Google Sheets';
type IntegrationStatus = 'Connected' | 'Disconnected';

type Integration = {
  name: IntegrationName;
  description: string;
  status: IntegrationStatus;
  lastSync: string;
};

type FieldType = 'text' | 'password' | 'checkbox';

type IntegrationField = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
};

type IntegrationSettings = Record<string, string | boolean>;
type StoredSettings = Record<IntegrationName, IntegrationSettings>;

const STORAGE_KEY = 'admin.integrations.settings.v1';

const defaultIntegrations: Integration[] = [
  {
    name: 'Razorpay',
    description: 'Payment gateway for invoices and checkout.',
    status: 'Connected',
    lastSync: '2026-04-19 08:15',
  },
  {
    name: 'Zoho CRM',
    description: 'Lead and contact sync between admin CRM and Zoho.',
    status: 'Connected',
    lastSync: '2026-04-19 06:00',
  },
  {
    name: 'WhatsApp Business API',
    description: 'Automated messages, broadcasts, and lead capture.',
    status: 'Connected',
    lastSync: '2026-04-18 22:30',
  },
  {
    name: 'Google Sheets',
    description: 'Export form submissions and reports to Sheets.',
    status: 'Disconnected',
    lastSync: '-',
  },
];

const integrationFields: Record<IntegrationName, IntegrationField[]> = {
  Razorpay: [
    { key: 'keyId', label: 'Key ID', type: 'text', placeholder: 'rzp_live_xxxxxx' },
    { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'Enter webhook secret' },
    { key: 'autoCapture', label: 'Auto-capture payments', type: 'checkbox' },
  ],
  'Zoho CRM': [
    { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Zoho client ID' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Zoho client secret' },
    { key: 'refreshToken', label: 'Refresh Token', type: 'password', placeholder: 'Zoho refresh token' },
  ],
  'WhatsApp Business API': [
    { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', placeholder: 'Meta phone number ID' },
    { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Permanent access token' },
    { key: 'verifyToken', label: 'Verify Token', type: 'password', placeholder: 'Webhook verify token' },
  ],
  'Google Sheets': [
    { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', placeholder: 'Google spreadsheet ID' },
    { key: 'serviceAccountEmail', label: 'Service Account Email', type: 'text', placeholder: 'service-account@project.iam.gserviceaccount.com' },
    { key: 'sheetName', label: 'Default Sheet Name', type: 'text', placeholder: 'Submissions' },
  ],
};

const defaultSettings: StoredSettings = {
  Razorpay: {
    keyId: '',
    webhookSecret: '',
    autoCapture: true,
  },
  'Zoho CRM': {
    clientId: '',
    clientSecret: '',
    refreshToken: '',
  },
  'WhatsApp Business API': {
    phoneNumberId: '',
    accessToken: '',
    verifyToken: '',
  },
  'Google Sheets': {
    spreadsheetId: '',
    serviceAccountEmail: '',
    sheetName: 'Submissions',
  },
};

function statusBadge(status: IntegrationStatus) {
  if (status === 'Connected') return 'bg-emerald-100 text-emerald-800';
  return 'bg-rose-100 text-rose-800';
}

function formatNow() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  const hh = `${now.getHours()}`.padStart(2, '0');
  const mm = `${now.getMinutes()}`.padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export default function AdminIntegrationsClient() {
  const [integrations, setIntegrations] = useState<Integration[]>(defaultIntegrations);
  const [settings, setSettings] = useState<StoredSettings>(defaultSettings);
  const [activeIntegration, setActiveIntegration] = useState<IntegrationName | null>(null);
  const [draftSettings, setDraftSettings] = useState<IntegrationSettings>({});
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { integrations?: Integration[]; settings?: StoredSettings };
      if (Array.isArray(parsed.integrations) && parsed.integrations.length > 0) {
        setIntegrations(parsed.integrations);
      }
      if (parsed.settings) {
        setSettings((prev) => ({ ...prev, ...parsed.settings }));
      }
    } catch {
      // Ignore invalid localStorage payloads and keep defaults.
    }
  }, []);

  useEffect(() => {
    const payload = JSON.stringify({ integrations, settings });
    localStorage.setItem(STORAGE_KEY, payload);
  }, [integrations, settings]);

  useEffect(() => {
    if (!saveMessage) return;
    const t = setTimeout(() => setSaveMessage(''), 2200);
    return () => clearTimeout(t);
  }, [saveMessage]);

  const activeFields = useMemo(() => {
    if (!activeIntegration) return [];
    return integrationFields[activeIntegration];
  }, [activeIntegration]);

  const openConfig = (name: IntegrationName) => {
    setActiveIntegration(name);
    setDraftSettings({ ...settings[name] });
    setSaveMessage('');
  };

  const closeConfig = () => {
    setActiveIntegration(null);
    setDraftSettings({});
  };

  const onSave = () => {
    if (!activeIntegration) return;

    setSettings((prev) => ({
      ...prev,
      [activeIntegration]: { ...draftSettings },
    }));

    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.name !== activeIntegration) return item;
        return { ...item, status: 'Connected', lastSync: formatNow() };
      }),
    );

    setSaveMessage('Saved successfully');
  };

  const onDisconnect = () => {
    if (!activeIntegration) return;

    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.name !== activeIntegration) return item;
        return { ...item, status: 'Disconnected', lastSync: '-' };
      }),
    );

    setSaveMessage('Disconnected');
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">Integrations</h1>
        <p className="mt-1 text-sm text-slate-400">Third-party services connected to the platform.</p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {integrations.map((integration) => (
          <article key={integration.name} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">{integration.name}</h2>
                <p className="mt-1 text-xs text-slate-400">{integration.description}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(integration.status)}`}
              >
                {integration.status}
              </span>
            </div>
            {integration.lastSync !== '-' && (
              <p className="mt-3 text-xs text-slate-500">Last sync: {integration.lastSync}</p>
            )}
            <button
              type="button"
              onClick={() => openConfig(integration.name)}
              className="mt-3 rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-950"
            >
              Configure
            </button>
          </article>
        ))}
      </section>

      {activeIntegration && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/35 sm:items-center sm:justify-end" role="dialog" aria-modal>
          <button type="button" className="absolute inset-0" onClick={closeConfig} aria-label="Close configure panel" />

          <aside className="relative z-10 h-[85vh] w-full rounded-t-2xl bg-slate-900/60 p-4 shadow-2xl sm:h-full sm:max-w-lg sm:rounded-none sm:rounded-l-2xl sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-100">Configure {activeIntegration}</h2>
                <p className="mt-1 text-xs text-slate-400">Update credentials and integration behavior.</p>
              </div>
              <button
                type="button"
                onClick={closeConfig}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-950"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4 overflow-y-auto pb-24">
              {activeFields.map((field) => {
                const value = draftSettings[field.key];

                if (field.type === 'checkbox') {
                  return (
                    <label key={field.key} className="flex items-center gap-3 rounded-lg border border-slate-800 p-3">
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) => {
                          setDraftSettings((prev) => ({ ...prev, [field.key]: e.target.checked }));
                        }}
                      />
                      <span className="text-sm font-medium text-slate-100">{field.label}</span>
                    </label>
                  );
                }

                return (
                  <label key={field.key} className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">{field.label}</span>
                    <input
                      type={field.type}
                      value={typeof value === 'string' ? value : ''}
                      placeholder={field.placeholder}
                      onChange={(e) => {
                        setDraftSettings((prev) => ({ ...prev, [field.key]: e.target.value }));
                      }}
                      className="w-full input outline-none ring-emerald-500 focus:border-emerald-500 focus:ring-2"
                    />
                  </label>
                );
              })}

              {saveMessage && (
                <p className="rounded-md border border-emerald-700/50 bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-300">
                  {saveMessage}
                </p>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-2 border-t border-slate-800 bg-slate-900/60 p-4">
              <button
                type="button"
                onClick={onDisconnect}
                className="rounded-md border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >
                Disconnect
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeConfig}
                  className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
