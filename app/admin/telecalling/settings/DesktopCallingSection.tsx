'use client';

import { useEffect, useState } from 'react';

interface Agent {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface Credential {
  agent_id: string;
  sip_username: string; // masked
  sip_domain: string;
  is_active: boolean;
  updated_at: string;
}

// Per-agent SIP identity provisioning for the desktop softphone (Exotel
// WebRTC / Unified License). Separate from the account-wide Exotel
// Configuration section above because these credentials are per-telecaller,
// issued individually by Exotel once the Unified License add-on is enabled.
export default function DesktopCallingSection() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [form, setForm] = useState({ sip_username: '', sip_password: '', sip_domain: 'sip.exotel.com' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [agentsRes, credsRes] = await Promise.all([
      fetch('/api/admin/telecalling/agents').then(r => r.json()).catch(() => ({ agents: [] })),
      fetch('/api/admin/telecalling/webrtc/credentials').then(r => r.json()).catch(() => ({ credentials: [] })),
    ]);
    setAgents(agentsRes.agents || []);
    setCredentials(credsRes.credentials || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(agentId: string) {
    setEditingAgentId(agentId);
    setForm({ sip_username: '', sip_password: '', sip_domain: 'sip.exotel.com' });
    setSaveError(null);
  }

  async function saveCredential(agentId: string) {
    if (!form.sip_username || !form.sip_password) {
      setSaveError('SIP username and password are required');
      return;
    }
    setSaving(true);
    setSaveError(null);
    const res = await fetch('/api/admin/telecalling/webrtc/credentials', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId, ...form }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setSaveError(data.error || 'Failed to save'); return; }
    setEditingAgentId(null);
    await load();
  }

  const credentialByAgent = Object.fromEntries(credentials.map(c => [c.agent_id, c]));

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
      <h2 className="font-semibold text-slate-100 mb-1">Desktop Calling (WebRTC Softphone)</h2>
      <p className="text-xs text-slate-500 mb-5">
        Requires Exotel&apos;s Unified License / WebRTC add-on enabled on your account. Each telecaller needs a SIP
        identity issued by Exotel — paste it here once you have it. Until a row is filled in, that agent&apos;s
        &quot;Call&quot; button stays disabled and they keep calling from their own phone as before.
      </p>

      {loading ? (
        <p className="text-sm text-slate-500">Loading agents…</p>
      ) : agents.length === 0 ? (
        <p className="text-sm text-slate-500">No telecaller profiles found.</p>
      ) : (
        <div className="space-y-2">
          {agents.map(agent => {
            const cred = credentialByAgent[agent.id];
            const isEditing = editingAgentId === agent.id;
            return (
              <div key={agent.id} className="border border-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">{agent.full_name || agent.email}</p>
                    <p className="text-xs text-slate-500">
                      {cred ? `SIP: ${cred.sip_username} @ ${cred.sip_domain}` : 'Not provisioned'}
                    </p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => startEdit(agent.id)}
                      className="text-xs border border-slate-700 rounded-lg px-3 py-1.5 hover:bg-slate-900 shrink-0"
                    >
                      {cred ? 'Update' : 'Provision'}
                    </button>
                  )}
                </div>

                {isEditing && (
                  <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
                    <input
                      placeholder="SIP username"
                      value={form.sip_username}
                      onChange={e => setForm(f => ({ ...f, sip_username: e.target.value }))}
                      className="w-full border border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-slate-900/60 text-slate-100"
                    />
                    <input
                      type="password"
                      placeholder="SIP password"
                      value={form.sip_password}
                      onChange={e => setForm(f => ({ ...f, sip_password: e.target.value }))}
                      className="w-full border border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-slate-900/60 text-slate-100"
                    />
                    <input
                      placeholder="SIP domain (e.g. sip.exotel.com)"
                      value={form.sip_domain}
                      onChange={e => setForm(f => ({ ...f, sip_domain: e.target.value }))}
                      className="w-full border border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-slate-900/60 text-slate-100"
                    />
                    {saveError && <p className="text-xs text-rose-400">{saveError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveCredential(agent.id)}
                        disabled={saving}
                        className="text-xs font-semibold bg-blue-700 hover:bg-blue-600 text-white rounded-lg px-3 py-1.5 disabled:opacity-50"
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingAgentId(null)}
                        className="text-xs border border-slate-700 rounded-lg px-3 py-1.5 hover:bg-slate-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
