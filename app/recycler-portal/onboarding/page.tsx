'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

const STEPS = ['Verify Identity', 'Categories & States', 'Certifications', 'Notifications'];

export default function RecyclerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 0: Verify recycler code
  const [recyclerCode, setRecyclerCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [recyclerName, setRecyclerName] = useState('');

  // Step 3: Notification prefs
  const [channels, setChannels] = useState({ email: true, sms: false, whatsapp: false, inApp: true });
  const [digestMode, setDigestMode] = useState('REALTIME');

  async function verifyCode() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/recycler-portal/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recyclerCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed');
      } else {
        trackEvent('Recycler Onboarding Code Verified', {});
        setVerified(true);
        setRecyclerName(data.recycler?.name ?? '');
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  }

  async function finishOnboarding() {
    setLoading(true);
    try {
      await fetch('/api/recycler-portal/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationPrefs: { channels, digestMode },
        }),
      });
      trackEvent('Recycler Onboarding Completed', {});
      router.push('/recycler-portal/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        {/* Step progress */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 flex-1">
              <div
                className={`h-2 rounded-full flex-1 transition-colors ${
                  i <= step ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
              {i < STEPS.length - 1 && <div className="w-1" />}
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mb-1">Step {step + 1} of {STEPS.length}</p>
        <h1 className="text-xl font-bold text-gray-900 mb-4">{STEPS[step]}</h1>

        {/* Step 0 — Verify code */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter your Recycler Code (e.g. <code className="bg-gray-100 px-1 rounded">REC-0001</code>).
              This was provided by your EPR manager when your account was created.
            </p>
            <input
              type="text"
              value={recyclerCode}
              onChange={(e) => setRecyclerCode(e.target.value.toUpperCase())}
              placeholder="REC-00001"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Recycler code"
            />
            {error && (
              <p role="alert" className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                {error}
              </p>
            )}
            <button
              onClick={verifyCode}
              disabled={loading || !recyclerCode}
              className="w-full rounded-xl bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
          </div>
        )}

        {/* Step 1 — Info display (categories come from DB, read-only) */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3">
              <p className="text-sm font-semibold text-green-800">Welcome, {recyclerName}!</p>
              <p className="text-xs text-green-700 mt-1">
                Your EPR categories and authorized states are pre-configured by your account manager.
                You can view them in your profile after onboarding.
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full rounded-xl bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2 — Certifications (informational) */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Your certifications are managed by your EPR account manager and will be verified before
              tender eligibility is assessed. If you have new certifications to add, contact your manager.
            </p>
            <button
              onClick={() => setStep(3)}
              className="w-full rounded-xl bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3 — Notification prefs */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Choose how you want to receive alerts for new tenders, auctions, CPCB notices, and corporate requests.
            </p>
            <div className="space-y-2">
              {(Object.keys(channels) as Array<keyof typeof channels>).map((ch) => (
                <label key={ch} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels[ch]}
                    onChange={(e) => setChannels((prev) => ({ ...prev, [ch]: e.target.checked }))}
                    className="h-4 w-4 rounded text-green-600"
                  />
                  <span className="text-sm text-gray-700 capitalize">{ch === 'inApp' ? 'In-App' : ch}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alert Frequency</label>
              <select
                value={digestMode}
                onChange={(e) => setDigestMode(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="REALTIME">Real-time (immediate)</option>
                <option value="DAILY">Daily digest</option>
                <option value="WEEKLY">Weekly digest</option>
              </select>
            </div>

            <button
              onClick={finishOnboarding}
              disabled={loading}
              className="w-full rounded-xl bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Complete Setup →'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
