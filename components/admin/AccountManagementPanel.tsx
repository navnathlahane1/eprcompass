'use client';

import { useState } from 'react';

interface Props {
  clientId: string;
  authUserId: string;
  email: string;
  isBanned: boolean;
  lastSignIn: string | null;
}

type ActionState = 'idle' | 'loading' | 'success' | 'error';

interface ActionResult {
  url?: string;
  email?: string;
  message?: string;
}

export default function AccountManagementPanel({
  clientId,
  email,
  isBanned,
  lastSignIn,
}: Props) {
  const [banned, setBanned] = useState(isBanned);
  const [states, setStates] = useState<Record<string, ActionState>>({});
  const [results, setResults] = useState<Record<string, ActionResult>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setActionState(action: string, state: ActionState) {
    setStates((prev) => ({ ...prev, [action]: state }));
  }

  async function callAction(action: string) {
    setActionState(action, 'loading');
    setErrors((prev) => ({ ...prev, [action]: '' }));
    setResults((prev) => ({ ...prev, [action]: {} }));

    try {
      const res = await fetch(`/api/admin/clients/${clientId}/account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (!res.ok) {
        setActionState(action, 'error');
        setErrors((prev) => ({ ...prev, [action]: data.error || 'Action failed.' }));
        return;
      }

      setActionState(action, 'success');

      if (action === 'toggle-active') {
        setBanned((prev) => !prev);
        setResults((prev) => ({
          ...prev,
          [action]: { message: data.banned ? 'Account deactivated.' : 'Account activated.' },
        }));
      } else if (data.url) {
        setResults((prev) => ({ ...prev, [action]: { url: data.url, email: data.email } }));
      }
    } catch {
      setActionState(action, 'error');
      setErrors((prev) => ({ ...prev, [action]: 'Network error. Please try again.' }));
    }
  }

  const formattedLastSignIn = lastSignIn
    ? new Date(lastSignIn).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : 'Never';

  return (
    <section className="admin-card">
      <div className="admin-card-header">Account Management</div>
      <div className="admin-card-body space-y-4">

        {/* Status summary */}
        <div className="flex flex-wrap items-center gap-5 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <span className="admin-field-label">Email</span>
            <span className="font-medium select-all">{email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="admin-field-label">Status</span>
            <span className={banned ? 'badge-churned' : 'badge-active'}>
              {banned ? 'Deactivated' : 'Active'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="admin-field-label">Last login</span>
            <span className="text-gray-600 dark:text-gray-400">{formattedLastSignIn}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            label="Reset Password"
            description="Generate a password-reset link for the client."
            buttonLabel="Generate Link"
            state={states['reset-password']}
            error={errors['reset-password']}
            result={results['reset-password']}
            accent="blue"
            onAction={() => callAction('reset-password')}
          />
          <ActionCard
            label="Send Welcome Link"
            description="Generate a one-click magic login link for onboarding."
            buttonLabel="Generate Magic Link"
            state={states['send-welcome']}
            error={errors['send-welcome']}
            result={results['send-welcome']}
            accent="indigo"
            onAction={() => callAction('send-welcome')}
          />
          <ActionCard
            label={banned ? 'Reactivate Account' : 'Deactivate Account'}
            description={banned ? 'Allow this client to sign in again.' : 'Prevent this client from signing in.'}
            buttonLabel={banned ? 'Reactivate' : 'Deactivate'}
            state={states['toggle-active']}
            error={errors['toggle-active']}
            result={results['toggle-active']}
            accent={banned ? 'green' : 'red'}
            onAction={() => callAction('toggle-active')}
            confirmMessage={!banned ? 'Are you sure you want to deactivate this account? The client will not be able to log in.' : undefined}
          />
        </div>

        {/* Impersonate */}
        <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
          <a href="/admin/impersonate" className="text-sm text-teal-600 hover:underline dark:text-teal-400">
            Login as this client (impersonate) →
          </a>
          <p className="text-xs text-gray-400 mt-0.5">Opens the impersonation tool — search for this client&apos;s email.</p>
        </div>
      </div>
    </section>
  );
}

// ─── Sub-component: individual action card ─────────────────────────────────

interface ActionCardProps {
  label: string;
  description: string;
  buttonLabel: string;
  state?: ActionState;
  error?: string;
  result?: ActionResult;
  accent: 'blue' | 'indigo' | 'green' | 'red';
  onAction: () => void;
  confirmMessage?: string;
}

const ACCENT_BTN: Record<string, string> = {
  blue:   'bg-blue-600 hover:bg-blue-700 text-white',
  indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  green:  'bg-green-600 hover:bg-green-700 text-white',
  red:    'bg-red-600 hover:bg-red-700 text-white',
};

function ActionCard({
  label,
  description,
  buttonLabel,
  state,
  error,
  result,
  accent,
  onAction,
  confirmMessage,
}: ActionCardProps) {
  function handleClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    onAction();
  }

  return (
    <div className="rounded-xl border border-[#e8ecf0] bg-[#f8fafc] p-3.5 space-y-2 dark:border-gray-700 dark:bg-gray-800/50">
      <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">{label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>

      <button
        type="button"
        disabled={state === 'loading'}
        onClick={handleClick}
        className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${ACCENT_BTN[accent]}`}
      >
        {state === 'loading' ? 'Working…' : buttonLabel}
      </button>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {state === 'success' && result?.message && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">{result.message}</p>
      )}

      {state === 'success' && result?.url && (
        <div className="space-y-1">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Link generated:</p>
          <div className="flex items-center gap-1">
            <input
              readOnly
              value={result.url}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-mono text-gray-700 select-all dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            />
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(result.url!)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
