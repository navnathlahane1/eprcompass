'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/crm/StatusBadge';
import { INDIA_STATES_UTS } from '@/lib/indiaGeo';
import { authenticatedFetch } from '@/lib/auth/authenticatedFetch';

const CATEGORIES = ['PIBO', 'Recycler', 'Importer', 'Brand Owner'];
const STATUS_OPTIONS = ['Onboarding', 'Active', 'At Risk', 'Churned'];
const WASTE_OPTIONS = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Oil'];

const DEFAULT_FORM = {
  full_name: '',
  email: '',
  company_name: '',
  gstin: '',
  state: '',
  category: 'PIBO',
  status: 'Onboarding',
  assigned_manager_id: '',
  waste_categories: []
};

export default function ClientDirectoryClient({ initialClients, managers }) {
  const [clients, setClients] = useState(initialClients || []);
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    category: 'All',
    status: 'All',
    waste: 'All',
    manager: 'All'
  });
  const [expandedId, setExpandedId] = useState(null);
  const [createForm, setCreateForm] = useState(DEFAULT_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Send Credentials — shown after a successful create/link
  const [linkedClientInfo, setLinkedClientInfo] = useState(null); // { clientId, email, phone, companyName }
  const [sendingCredentials, setSendingCredentials] = useState(false);
  const [sendCredentialsMsg, setSendCredentialsMsg] = useState('');

  // Intel company search (pre-fill)
  const [intelQuery, setIntelQuery] = useState('');
  const [intelResults, setIntelResults] = useState([]);
  const [intelSearching, setIntelSearching] = useState(false);
  const [selectedIntel, setSelectedIntel] = useState(null);
  const intelRef = useRef(null);

  // Existing IAM user search (link mode)
  const [createMode, setCreateMode] = useState('new'); // 'new' | 'link'
  const [iamQuery, setIamQuery] = useState('');
  const [iamResults, setIamResults] = useState([]);
  const [iamSearching, setIamSearching] = useState(false);
  const [selectedIamUser, setSelectedIamUser] = useState(null);
  const [existingEmailAccount, setExistingEmailAccount] = useState(null);
  const iamRef = useRef(null);

  const filteredClients = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    return (clients || []).filter((client) => {
      const matchesSearch = !searchValue || (client.company_name || '').toLowerCase().includes(searchValue);
      const matchesCategory = filters.category === 'All' || client.category === filters.category;
      const matchesStatus = filters.status === 'All' || client.status === filters.status;
      const matchesWaste =
        filters.waste === 'All' || (client.waste_categories || []).some((item) => item === filters.waste);
      const matchesManager = filters.manager === 'All' || client.assigned_manager_id === filters.manager;

      return matchesSearch && matchesCategory && matchesStatus && matchesWaste && matchesManager;
    });
  }, [clients, search, filters]);

  const categoryOptions = ['All', ...new Set((clients || []).map((item) => item.category).filter(Boolean))];
  const statusOptions = ['All', ...new Set((clients || []).map((item) => item.status).filter(Boolean))];
  const wasteOptions = [
    'All',
    ...new Set(
      (clients || [])
        .flatMap((item) => item.waste_categories || [])
        .filter(Boolean)
    )
  ];

  const managerMap = new Map((managers || []).map((manager) => [manager.id, manager.full_name || manager.id]));

  // ── Intel company search — debounced 300ms + AbortController ──────────
  useEffect(() => {
    if (intelQuery.length < 2) { setIntelResults([]); setIntelSearching(false); return; }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setIntelSearching(true);
      try {
        const res = await fetch(
          `/api/admin/intel-companies/search?q=${encodeURIComponent(intelQuery)}`,
          { signal: ctrl.signal }
        );
        const data = await res.json().catch(() => ({}));
        if (!ctrl.signal.aborted) setIntelResults(data.companies || []);
      } catch (e) {
        if (e.name !== 'AbortError') setIntelResults([]);
      } finally {
        if (!ctrl.signal.aborted) setIntelSearching(false);
      }
    }, 300);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [intelQuery]);

  // Close intel dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (intelRef.current && !intelRef.current.contains(e.target)) setIntelResults([]);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectIntelCompany = useCallback((company) => {
    setSelectedIntel(company);
    setIntelQuery(company.canonical_name);
    setIntelResults([]);
    setCreateForm((prev) => ({
      ...prev,
      company_name: company.canonical_name || prev.company_name,
      gstin: company.gstin || prev.gstin,
      state: company.state || prev.state,
    }));
  }, []);

  // ── IAM user search — debounced 300ms + AbortController ───────────────
  useEffect(() => {
    if (iamQuery.length < 2) { setIamResults([]); setIamSearching(false); return; }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setIamSearching(true);
      try {
        const res = await fetch(
          `/api/admin/portal-users/search?q=${encodeURIComponent(iamQuery)}`,
          { signal: ctrl.signal }
        );
        const data = await res.json().catch(() => ({}));
        if (!ctrl.signal.aborted) setIamResults(data.users || []);
      } catch (e) {
        if (e.name !== 'AbortError') setIamResults([]);
      } finally {
        if (!ctrl.signal.aborted) setIamSearching(false);
      }
    }, 300);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [iamQuery]);

  // Close IAM dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (iamRef.current && !iamRef.current.contains(e.target)) setIamResults([]);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectIamUser = useCallback((user) => {
    setSelectedIamUser(user);
    setIamQuery(user.company_name || user.full_name || user.email || '');
    setIamResults([]);
    setCreateForm((prev) => ({
      ...prev,
      full_name: user.full_name || prev.full_name,
      company_name: user.company_name || prev.company_name,
    }));
  }, []);

  // ── Submit ──────────────────────────────────────────────────────────────
  async function onCreateClient(event) {
    event.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    setCreateSuccess('');

    let body;

    if (createMode === 'link') {
      // Link existing IAM user
      if (!selectedIamUser) {
        setCreateError('Please search and select an IAM portal user to link.');
        setCreateLoading(false);
        return;
      }
      body = {
        existing_profile_id: selectedIamUser.id,
        company_name: createForm.company_name || undefined,
        gstin: createForm.gstin || undefined,
        state: createForm.state || undefined,
        category: createForm.category,
        status: createForm.status,
        assigned_manager_id: createForm.assigned_manager_id || undefined,
        waste_categories: createForm.waste_categories,
        intel_company_id: selectedIntel?.id || undefined,
      };
    } else {
      // Create new user
      const normalizedEmail = String(createForm.email || '').trim().toLowerCase();
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
      if (!validEmail) {
        setCreateError('Please enter a valid client email address.');
        setCreateLoading(false);
        return;
      }
      body = {
        full_name: createForm.full_name,
        email: normalizedEmail,
        company_name: createForm.company_name || undefined,
        gstin: createForm.gstin || undefined,
        state: createForm.state || undefined,
        category: createForm.category,
        status: createForm.status,
        assigned_manager_id: createForm.assigned_manager_id || undefined,
        waste_categories: createForm.waste_categories,
        intel_company_id: selectedIntel?.id || undefined,
      };
    }

    try {
      const response = await authenticatedFetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setExistingEmailAccount(response.status === 409 ? payload.existingUser || null : null);
        setCreateError(String(payload?.error || '').trim() || `Unable to create client (HTTP ${response.status}).`);
        return;
      }

      // Optimistically add to list
      setClients((prev) => [{
        id: payload.clientId,
        profile_id: payload.profileId,
        company_name: createForm.company_name || createForm.full_name || selectedIamUser?.company_name || selectedIamUser?.full_name,
        category: createForm.category,
        status: createForm.status,
        waste_categories: createForm.waste_categories,
        assigned_manager_id: createForm.assigned_manager_id || null,
      }, ...prev]);

      // Send Credentials panel needs the client id + contact info before we reset the form
      setLinkedClientInfo({
        clientId: payload.clientId,
        email: payload.email || createForm.email || selectedIamUser?.email || null,
        phone: selectedIamUser?.phone || null,
        companyName: createForm.company_name || createForm.full_name || selectedIamUser?.company_name || selectedIamUser?.full_name || 'the client',
      });
      setSendCredentialsMsg('');

      // Reset
      setCreateForm(DEFAULT_FORM);
      setSelectedIntel(null);
      setIntelQuery('');
      setSelectedIamUser(null);
      setExistingEmailAccount(null);
      setIamQuery('');

      if (payload.linked) {
        setCreateSuccess(`✓ Portal account linked! Client record created for ${payload.email || 'user'}.`);
      } else {
        setCreateSuccess(`✓ Client created. Temporary password: ${payload.temporaryPassword}`);
      }
    } catch {
      setCreateError('Unable to create client right now.');
    } finally {
      setCreateLoading(false);
    }
  }

  async function sendCredentials(channel) {
    if (!linkedClientInfo?.clientId) return;
    setSendingCredentials(true);
    setSendCredentialsMsg('');
    try {
      const response = await fetch(`/api/admin/clients/${linkedClientInfo.clientId}/account`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'send-welcome' }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.url) {
        setSendCredentialsMsg(String(payload?.error || 'Unable to generate a login link.'));
        return;
      }

      const loginUrl = `${window.location.origin}/portal/login`;
      const message = [
        `Hello!`,
        `Your EPR Client Portal account is ready.`,
        ``,
        `Login URL: ${loginUrl}`,
        linkedClientInfo.email ? `Email: ${linkedClientInfo.email}` : '',
        ``,
        `Click this link to access your portal instantly (valid for a limited time):`,
        payload.url,
        ``,
        `Contact us if you need a new link or a password reset.`,
      ].filter(Boolean).join('\n');

      if (channel === 'whatsapp') {
        const phone = (linkedClientInfo.phone || '').replace(/\D/g, '');
        if (!phone) { setSendCredentialsMsg('No phone number on file for this client.'); return; }
        window.open(
          `https://wa.me/${phone.startsWith('91') ? phone : `91${phone}`}?text=${encodeURIComponent(message)}`,
          '_blank'
        );
      } else if (channel === 'email') {
        if (!linkedClientInfo.email) { setSendCredentialsMsg('No email on file for this client.'); return; }
        window.location.href = `mailto:${linkedClientInfo.email}?subject=${encodeURIComponent('Your EPR Client Portal Access')}&body=${encodeURIComponent(message)}`;
      } else if (channel === 'copy') {
        await navigator.clipboard.writeText(message);
        setSendCredentialsMsg('✓ Message copied to clipboard.');
      }
    } catch {
      setSendCredentialsMsg('Unable to generate a login link right now.');
    } finally {
      setSendingCredentials(false);
    }
  }

  function toggleWaste(cat) {
    setCreateForm((prev) => ({
      ...prev,
      waste_categories: prev.waste_categories.includes(cat)
        ? prev.waste_categories.filter((w) => w !== cat)
        : [...prev.waste_categories, cat],
    }));
  }

  return (
    <div className="space-y-4">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Client Directory</h1>
          <p className="admin-page-subtitle">Create clients, filter by business profile, and expand rows for context.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreateError('');
            setCreateSuccess('');
            setShowCreateForm((prev) => !prev);
          }}
          className="btn-primary"
        >
          {showCreateForm ? 'Close Form' : 'Create Client'}
        </button>
      </div>

      {showCreateForm ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Add Client</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Create a new portal login, or link an existing IAM account to a company from Intel.
            </p>
          </div>

          {/* ── Mode toggle ── */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setCreateMode('new'); setSelectedIamUser(null); setIamQuery(''); }}
              className={`rounded-lg px-4 py-2 text-xs font-medium border transition ${
                createMode === 'new'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              Create New Login
            </button>
            <button
              type="button"
              onClick={() => { setCreateMode('link'); setCreateForm((p) => ({ ...p, email: '' })); }}
              className={`rounded-lg px-4 py-2 text-xs font-medium border transition ${
                createMode === 'link'
                  ? 'bg-teal-600 border-teal-600 text-white'
                  : 'border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              Link Existing IAM Account
            </button>
          </div>

          {/* ── Intel company search (pre-fill) ── */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-xs font-semibold text-amber-300 mb-2">
              📋 Pre-fill from Intel Company (optional)
            </p>
            <div className="relative" ref={intelRef}>
              <input
                type="text"
                value={intelQuery}
                onChange={(e) => {
                  setIntelQuery(e.target.value);
                  if (!e.target.value) setSelectedIntel(null);
                }}
                placeholder="Search by company name or GSTIN…"
                className="input w-full text-sm"
              />
              {intelSearching && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 animate-pulse">Searching…</div>
              )}
              {intelResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
                  {intelResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectIntelCompany(c)}
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-xs hover:bg-slate-800 transition border-b border-slate-800 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-100 truncate">{c.canonical_name}</p>
                        <p className="text-slate-500 mt-0.5">
                          {[c.gstin, c.state, c.company_type].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedIntel && (
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-300">
                <span className="text-emerald-400">✓</span>
                Pre-filled from: <strong>{selectedIntel.canonical_name}</strong>
                {selectedIntel.gstin && <span className="text-slate-500">({selectedIntel.gstin})</span>}
              </div>
            )}
          </div>

          {/* ── Link IAM user search ── */}
          {createMode === 'link' && (
            <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-3">
              <p className="text-xs font-semibold text-teal-300 mb-2">Select IAM Portal Account</p>
              <div className="relative" ref={iamRef}>
                <input
                  type="text"
                  value={iamQuery}
                  onChange={(e) => {
                    setIamQuery(e.target.value);
                    if (!e.target.value) setSelectedIamUser(null);
                  }}
                  placeholder="Search by name, email, or company…"
                  className="input w-full text-sm"
                />
                {iamSearching && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 animate-pulse">Searching…</div>
                )}
                {iamResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
                    {iamResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          if (u.already_linked) {
                            if (!window.confirm(
                              `"${u.company_name || u.full_name}" is currently linked to "${u.linked_company_name || 'another company'}". ` +
                              `Moving it here will disconnect it from that company and create a new client record here. Continue?`
                            )) return;
                          }
                          selectIamUser(u);
                        }}
                        className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-xs border-b border-slate-800 last:border-0 hover:bg-slate-800 cursor-pointer transition"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-100 truncate">
                            {u.company_name || u.full_name || '—'}
                          </p>
                          <p className="text-slate-500 mt-0.5 truncate">{u.email}</p>
                          {u.already_linked && (
                            <p className="text-amber-400 mt-0.5 text-[10px]">
                              ⚠ Linked to {u.linked_company_name || 'another company'} — will be moved
                            </p>
                          )}
                        </div>
                        {u.already_linked && (
                          <span className="shrink-0 text-[10px] bg-amber-900/40 text-amber-400 border border-amber-700/40 rounded px-1.5 py-0.5">Move</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedIamUser && (
                <div className="mt-2 rounded-md border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-xs">
                  <p className="font-semibold text-teal-200">
                    ✓ Selected: {selectedIamUser.company_name || selectedIamUser.full_name}
                  </p>
                  <p className="text-slate-400 mt-0.5">{selectedIamUser.email}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Main form ── */}
          <form onSubmit={onCreateClient} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">

            {/* Contact name — only required for new user */}
            {createMode === 'new' && (
              <input
                required
                value={createForm.full_name}
                onChange={(e) => setCreateForm((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Contact name *"
                className="input"
              />
            )}

            {/* Email — only for new user */}
            {createMode === 'new' && (
              <input
                required
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email *"
                className="input"
              />
            )}

            <input
              value={createForm.company_name}
              onChange={(e) => setCreateForm((p) => ({ ...p, company_name: e.target.value }))}
              placeholder="Company name"
              className="input"
            />

            <input
              value={createForm.gstin}
              onChange={(e) => setCreateForm((p) => ({ ...p, gstin: e.target.value }))}
              placeholder="GSTIN (optional)"
              className="input font-mono text-sm"
            />

            <select
              value={createForm.state}
              onChange={(e) => setCreateForm((p) => ({ ...p, state: e.target.value }))}
              className="input"
            >
              <option value="">State (optional)</option>
              {INDIA_STATES_UTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              required
              value={createForm.category}
              onChange={(e) => setCreateForm((p) => ({ ...p, category: e.target.value }))}
              className="input"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={createForm.status}
              onChange={(e) => setCreateForm((p) => ({ ...p, status: e.target.value }))}
              className="input"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={createForm.assigned_manager_id}
              onChange={(e) => setCreateForm((p) => ({ ...p, assigned_manager_id: e.target.value }))}
              className="input"
            >
              <option value="">Manager: Unassigned</option>
              {(managers || []).map((m) => (
                <option key={m.id} value={m.id}>{m.full_name || m.id}</option>
              ))}
            </select>

            <div className="md:col-span-2 xl:col-span-3">
              <p className="mb-1 text-xs font-medium text-slate-400">Waste Categories</p>
              <div className="flex flex-wrap gap-2">
                {WASTE_OPTIONS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => toggleWaste(w)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      createForm.waste_categories.includes(w)
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-700 text-slate-400 hover:bg-slate-950'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 xl:col-span-3 flex items-center gap-2">
              <button
                type="submit"
                disabled={createLoading}
                aria-busy={createLoading}
                className="btn-primary"
              >
                {createLoading
                  ? (createMode === 'link' ? 'Linking…' : 'Creating…')
                  : (createMode === 'link' ? 'Link Account & Create Client' : 'Create Client')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setSelectedIntel(null); setIntelQuery('');
                  setSelectedIamUser(null); setIamQuery('');
                  setLinkedClientInfo(null); setSendCredentialsMsg('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>

          <p
            role={createError ? 'alert' : 'status'}
            aria-live="polite"
            className={`text-xs font-medium min-h-[1rem] ${createError ? 'text-rose-300' : createSuccess ? 'text-emerald-400' : 'text-transparent'}`}
          >
            {createError || createSuccess || ' '}
          </p>
          {existingEmailAccount?.canLink && <button type="button" className="mt-2 text-sm font-semibold text-blue-400 underline" onClick={() => {
            setCreateMode('link');
            setSelectedIamUser({ id: existingEmailAccount.id, email: existingEmailAccount.email, full_name: createForm.full_name, company_name: createForm.company_name });
            setIamQuery(existingEmailAccount.email || '');
            setExistingEmailAccount(null);
            setCreateError('Existing login selected. Review the company details, then choose Link Account & Create Client.');
          }}>Use existing portal login</button>}
          {existingEmailAccount?.clientId && <Link href={`/admin/crm/clients/${existingEmailAccount.clientId}`} className="mt-2 inline-block text-sm text-blue-400 underline">Open existing client</Link>}

          {linkedClientInfo && (
            <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-3 space-y-2">
              <p className="text-xs font-semibold text-teal-300">
                📨 Send Credentials — {linkedClientInfo.companyName}
              </p>
              <p className="text-[11px] text-slate-500">
                Generates a one-click login link for the client's portal account and lets you send it via WhatsApp, email, or copy it directly.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => sendCredentials('whatsapp')}
                  disabled={sendingCredentials}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {sendingCredentials ? 'Generating…' : 'Send via WhatsApp'}
                </button>
                <button
                  type="button"
                  onClick={() => sendCredentials('email')}
                  disabled={sendingCredentials}
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {sendingCredentials ? 'Generating…' : 'Send via Email'}
                </button>
                <button
                  type="button"
                  onClick={() => sendCredentials('copy')}
                  disabled={sendingCredentials}
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  Copy Message
                </button>
              </div>
              {sendCredentialsMsg && (
                <p className="text-[11px] text-amber-300">{sendCredentialsMsg}</p>
              )}
            </div>
          )}
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company"
            className="input"
          />

          <select
            value={filters.category}
            onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
            className="input"
          >
            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                Category: {item}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="input"
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                Status: {item}
              </option>
            ))}
          </select>

          <select
            value={filters.waste}
            onChange={(event) => setFilters((prev) => ({ ...prev, waste: event.target.value }))}
            className="input"
          >
            {wasteOptions.map((item) => (
              <option key={item} value={item}>
                Waste: {item}
              </option>
            ))}
          </select>

          <select
            value={filters.manager}
            onChange={(event) => setFilters((prev) => ({ ...prev, manager: event.target.value }))}
            className="input"
          >
            <option value="All">Manager: All</option>
            {(managers || []).map((manager) => (
              <option key={manager.id} value={manager.id}>
                Manager: {manager.full_name || manager.id}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-xs font-medium text-slate-400">Total clients: <span className="tabular-nums">{filteredClients.length}</span></div>
        {filteredClients.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">No clients match these filters</p>
            <p className="empty-state-body">Try clearing the search or category filter, or create a new client to get started.</p>
          </div>
        ) : null}
        {filteredClients.map((client) => {
          const expanded = expandedId === client.id;

          return (
            <article key={client.id} className="rounded-xl border border-slate-800 bg-slate-900/60">
              <button
                type="button"
                onClick={() => setExpandedId((prev) => (prev === client.id ? null : client.id))}
                className="flex w-full flex-col items-start justify-between gap-2 p-4 text-left sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    <Link href={`/admin/crm/clients/${client.id}`} className="hover:text-blue-300" onClick={(e) => e.stopPropagation()}>
                      {client.company_name || 'Unnamed company'}
                    </Link>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {client.category} · Manager: {managerMap.get(client.assigned_manager_id) || 'Unassigned'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge type="lead" status={client.status} />
                  <span className="text-xs text-slate-500">{expanded ? 'Hide' : 'Expand'}</span>
                </div>
              </button>

              {expanded ? (
                <div className="grid grid-cols-1 gap-4 border-t border-slate-800/60 p-4 lg:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Services</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-200">
                      {(client.services || []).length === 0 ? <li>No services</li> : null}
                      {(client.services || []).map((service) => (
                        <li key={service.id}>
                          {service.service_type} · {service.status} · Due {service.due_date || '-'}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last 3 Activities</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-200">
                      {(client.activities || []).length === 0 ? <li>No activities</li> : null}
                      {(client.activities || []).slice(0, 3).map((activity) => (
                        <li key={activity.id}>
                          {activity.type}: {activity.note || 'No note'}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open Payments</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-200">
                      {(client.open_payments || []).length === 0 ? <li>No open payments</li> : null}
                      {(client.open_payments || []).map((payment) => (
                        <li key={payment.id}>
                          {payment.invoice_no || 'No invoice'} · INR {Number(payment.amount_inr || 0).toLocaleString('en-IN')} · {payment.status}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}
