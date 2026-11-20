'use client';

/**
 * NotificationSubscribeWidget
 * ────────────────────────────
 * Compact email subscription form for EPR notification alerts.
 * Embeddable on the listing page, detail page sidebar, and homepage.
 */

import { useState } from 'react';
import { Bell, CheckCircle2, Loader2, X } from 'lucide-react';

const EPR_TYPES = [
  { value: 'Plastic',   label: '♻ Plastic' },
  { value: 'E-Waste',   label: '💻 E-Waste' },
  { value: 'Battery',   label: '🔋 Battery' },
  { value: 'Tyre',      label: '🚗 Tyre' },
  { value: 'Hazardous', label: '⚗ Hazardous' },
];

interface Props {
  prefillEprType?: string;
  compact?:        boolean;
  onClose?:        () => void;
}

export default function NotificationSubscribeWidget({ prefillEprType, compact, onClose }: Props) {
  const [email,     setEmail]     = useState('');
  const [name,      setName]      = useState('');
  const [eprTypes,  setEprTypes]  = useState<string[]>(prefillEprType ? [prefillEprType] : []);
  const [frequency, setFrequency] = useState<'instant' | 'daily' | 'weekly'>('weekly');
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState('');

  function toggleEprType(val: string) {
    setEprTypes((prev) =>
      prev.includes(val) ? prev.filter((t) => t !== val) : [...prev, val]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/notifications/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, name, eprTypes, frequency }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Subscription failed');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <h3 className="font-semibold text-green-800 mb-1">You&apos;re subscribed!</h3>
        <p className="text-sm text-green-700">
          Check your email to confirm your subscription. You&apos;ll receive {frequency} alerts for new EPR notifications.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-blue-900">Get Notified</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            {loading ? 'Subscribing…' : 'Subscribe to Alerts'}
          </button>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
        <p className="text-[11px] text-blue-400 mt-2">Weekly digest · Unsubscribe anytime</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 relative">
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Get EPR Notification Alerts</h3>
          <p className="text-sm text-gray-500">Never miss a compliance update</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email *</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Name (optional)</label>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
        </div>

        {/* EPR type checkboxes */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">EPR Types (leave blank for all)</label>
          <div className="flex flex-wrap gap-2">
            {EPR_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleEprType(value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                  ${eprTypes.includes(value)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Alert Frequency</label>
          <div className="grid grid-cols-3 gap-2">
            {(['instant', 'daily', 'weekly'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                className={`py-2 text-xs rounded-lg border font-medium transition-colors capitalize
                  ${frequency === f
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60">
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Subscribing…</>
            : <><Bell className="w-4 h-4" /> Subscribe to Notifications</>}
        </button>

        <p className="text-xs text-center text-gray-400">
          You&apos;ll receive a confirmation email. Unsubscribe anytime.
        </p>
      </form>
    </div>
  );
}
