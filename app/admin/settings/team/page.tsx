'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AVAILABLE_MODULES,
  TEAM_STORAGE_KEY,
  defaultModulesByRole,
  type TeamRole
} from '@/lib/admin/moduleAccess';

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  active: boolean;
  modules: string[];
};

const ROLE_OPTIONS: Array<{ value: TeamRole; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'operator', label: 'Operator' },
  { value: 'hr-executive', label: 'HR Executive' },
  { value: 'sales-executive', label: 'Sales Executive' },
  { value: 'training-executive', label: 'Training Executive' },
  { value: 'epr-executive', label: 'EPR Executive' }
];

function roleLabel(role: TeamRole) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label || role;
}

const defaultMembers: TeamMember[] = [
  {
    id: 'owner',
    name: 'EPR Compass Admin',
    email: 'supporteprcompass@gmail.com',
    role: 'admin',
    active: true,
    modules: defaultModulesByRole('admin')
  }
];

export default function AdminTeamSettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>(defaultMembers);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<TeamMember['role']>('manager');
  const [selectedModules, setSelectedModules] = useState<string[]>(defaultModulesByRole('manager'));
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TEAM_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as TeamMember[];
      if (Array.isArray(parsed) && parsed.length) {
        const normalized = parsed.map((member) => ({
          ...member,
          modules: Array.isArray((member as any).modules)
            ? (member as any).modules
            : defaultModulesByRole((member as any).role || 'operator')
        }));
        setMembers(normalized);
      }
    } catch {
      // Ignore bad local data.
    }
  }, []);

  function saveMembers(nextMembers: TeamMember[]) {
    setMembers(nextMembers);
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(nextMembers));
    setSaved(true);
  }

  function toggleSelectedModule(moduleName: string) {
    setSelectedModules((prev) =>
      prev.includes(moduleName)
        ? prev.filter((item) => item !== moduleName)
        : [...prev, moduleName]
    );
    setSaved(false);
  }

  function toggleMemberModule(memberId: string, moduleName: string) {
    const nextMembers = members.map((member) => {
      if (member.id !== memberId) return member;
      const hasModule = member.modules.includes(moduleName);
      return {
        ...member,
        modules: hasModule
          ? member.modules.filter((item) => item !== moduleName)
          : [...member.modules, moduleName]
      };
    });
    saveMembers(nextMembers);
  }

  async function addMember() {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName || !cleanEmail || !password) {
      setErrorMessage('Name, email and password are required.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    const exists = members.some((member) => member.email === cleanEmail);
    if (exists) {
      setErrorMessage('A team member with this email already exists.');
      return;
    }

    setCreating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/admin/team/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          role,
          password
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(result?.error || 'Could not create user account for this member.');
        return;
      }

      const nextMembers: TeamMember[] = [
        ...members,
        {
          id: String(result?.userId || crypto.randomUUID()),
          name: cleanName,
          email: cleanEmail,
          role,
          active: true,
          modules: selectedModules.length ? selectedModules : defaultModulesByRole(role)
        }
      ];

      saveMembers(nextMembers);
      setName('');
      setEmail('');
      setPassword('');
      setRole('manager');
      setSelectedModules(defaultModulesByRole('manager'));
    } catch {
      setErrorMessage('Could not create user account for this member.');
    } finally {
      setCreating(false);
    }
  }

  function toggleActive(id: string) {
    const nextMembers = members.map((member) =>
      member.id === id ? { ...member, active: !member.active } : member
    );
    saveMembers(nextMembers);
  }

  function removeMember(id: string) {
    const nextMembers = members.filter((member) => member.id !== id);
    saveMembers(nextMembers.length ? nextMembers : defaultMembers);
  }

  const activeCount = useMemo(() => members.filter((member) => member.active).length, [members]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-bold text-slate-100">Team Settings</h1>
        <p className="mt-1 text-slate-400">Manage admin console access and team roles.</p>
        <p className="mt-2 text-sm text-slate-500">Active members: {activeCount}</p>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Invite Team Member</h2>

        <div className="grid gap-3 md:grid-cols-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrorMessage(null);
              setSaved(false);
            }}
            className="rounded-lg border border-slate-700 px-3 py-2"
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMessage(null);
              setSaved(false);
            }}
            className="rounded-lg border border-slate-700 px-3 py-2"
          />

          <input
            type="password"
            placeholder="Password (min 8 chars)"
            value={password}
            minLength={8}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMessage(null);
              setSaved(false);
            }}
            className="rounded-lg border border-slate-700 px-3 py-2"
          />

          <select
            value={role}
            onChange={(e) => {
              const nextRole = e.target.value as TeamMember['role'];
              setRole(nextRole);
              setSelectedModules(defaultModulesByRole(nextRole));
              setErrorMessage(null);
              setSaved(false);
            }}
            className="rounded-lg border border-slate-700 px-3 py-2"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-200">Module Access</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {AVAILABLE_MODULES.map((moduleName) => (
              <label key={moduleName} className="flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={selectedModules.includes(moduleName)}
                  onChange={() => toggleSelectedModule(moduleName)}
                />
                <span className="capitalize">{moduleName.replace('-', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        {errorMessage ? <p className="text-sm text-rose-400">{errorMessage}</p> : null}

        <button
          onClick={addMember}
          disabled={creating}
          className="btn-primary"
        >
          {creating ? 'Creating user...' : 'Add Member'}
        </button>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Current Team</h2>

        {members.map((member) => (
          <article key={member.id} className="flex flex-col gap-3 rounded-lg border border-slate-800 p-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-slate-100">{member.name}</p>
              <p className="text-sm text-slate-400">{member.email}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500">Role: {roleLabel(member.role)}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {member.modules.map((moduleName) => (
                  <span key={moduleName} className="rounded-full bg-blue-950/30 px-2 py-0.5 text-[11px] font-medium text-blue-300">
                    {moduleName}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Edit Module Access</p>
                <div className="flex flex-wrap gap-1">
                  {AVAILABLE_MODULES.map((moduleName) => {
                    const hasModule = member.modules.includes(moduleName);
                    return (
                      <button
                        key={`${member.id}-${moduleName}`}
                        onClick={() => toggleMemberModule(member.id, moduleName)}
                        className={`rounded-full px-2 py-1 text-[11px] font-medium ${hasModule ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-200'}`}
                      >
                        {moduleName}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
              <button
                onClick={() => toggleActive(member.id)}
                className={`rounded-lg px-3 py-1 text-sm ${member.active ? 'bg-emerald-900/30 text-emerald-300' : 'bg-slate-900 text-slate-200'}`}
              >
                {member.active ? 'Active' : 'Inactive'}
              </button>

              <button
                onClick={() => removeMember(member.id)}
                className="rounded-lg bg-rose-900/30 px-3 py-1 text-sm text-rose-300 hover:bg-red-200"
              >
                Remove
              </button>
              </div>
            </div>
          </article>
        ))}

        {saved ? <p className="text-sm text-emerald-300">Team settings saved.</p> : null}
      </section>
    </div>
  );
}
