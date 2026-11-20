'use client';

import { useEffect, useState, useCallback } from 'react';
import { Switch } from '@headlessui/react';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

interface FeatureFlag {
  feature: string;
  enabled: boolean;
  updated_at: string | null;
  updated_by: string | null;
}

const KNOWN_FEATURES: { key: string; label: string; description: string }[] = [
  {
    key: 'recyclerNetwork',
    label: 'Recycler / PRO Network',
    description: 'Allow this client to discover, link, and manage recyclers and PROs across EPR categories.',
  },
  // [UPGRADE] Add future per-client features here
];

export function ClientFeatureFlagsClient({ clientId }: { clientId: string }) {
  const [flags, setFlags] = useState<Map<string, FeatureFlag>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);   // feature key being saved
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/features`);
      if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
      const json = await res.json();
      const map = new Map<string, FeatureFlag>();
      for (const f of json.flags ?? []) map.set(f.feature, f);
      setFlags(map);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load features');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function toggle(featureKey: string, enabled: boolean) {
    setSaving(featureKey);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/features`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature: featureKey, enabled }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);

      setFlags((prev) => {
        const next = new Map(prev);
        next.set(featureKey, {
          feature: featureKey,
          enabled,
          updated_at: new Date().toISOString(),
          updated_by: 'you',
        });
        return next;
      });
      setToast({ msg: `${featureKey} ${enabled ? 'enabled' : 'disabled'}`, ok: true });
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : 'Save failed', ok: false });
    } finally {
      setSaving(null);
      setTimeout(() => setToast(null), 3000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading feature flags…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-8 text-rose-400">
        <AlertTriangle className="h-5 w-5" />
        <span>{error}</span>
        <button onClick={load} className="ml-2 underline text-sm">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
            toast.ok ? 'bg-emerald-950/30 text-emerald-300' : 'bg-rose-950/30 text-rose-300'
          }`}
        >
          {toast.ok ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {KNOWN_FEATURES.map((feat) => {
        const flag = flags.get(feat.key);
        const isEnabled = flag?.enabled ?? false;
        const isSaving = saving === feat.key;

        return (
          <div
            key={feat.key}
            className="flex items-start justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-sm"
          >
            <div className="flex-1 pr-4">
              <p className="font-semibold text-slate-100">{feat.label}</p>
              <p className="mt-0.5 text-sm text-slate-500">{feat.description}</p>
              {flag?.updated_at && (
                <p className="mt-1 text-xs text-slate-500">
                  Last changed: {new Date(flag.updated_at).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
              <Switch
                checked={isEnabled}
                onChange={(val) => toggle(feat.key, val)}
                disabled={isSaving}
                aria-label={`Toggle ${feat.label}`}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-eco-green-5 focus:ring-offset-2 ${
                  isEnabled ? 'bg-eco-green-5' : 'bg-slate-800'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-slate-900/60 shadow transition-transform ${
                    isEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </Switch>
            </div>
          </div>
        );
      })}
    </div>
  );
}
