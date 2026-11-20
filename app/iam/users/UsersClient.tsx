'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IamUser {
  id: string;
  email?: string | null;
  role: string;
  full_name?: string | null;
  company_name?: string | null;
  phone?: string | null;
  is_banned: boolean;
  banned_reason?: string | null;
  banned_at?: string | null;
  notes?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ALL_ROLES = [
  'client', 'partner', 'cepc', 'recycler', 'telecaller', 'sales-executive',
  'manager', 'user_manager', 'task_manager',
  'cfo', 'finance_executive',
  'academy_director', 'academy_manager', 'training_program_manager', 'trainer', 'guest_trainer', 'partner_trainer', 'learner',
  'comms_cmo', 'comms_brand_manager', 'comms_regional_manager', 'comms_campaign_manager',
  'comms_social_media_manager', 'comms_content_strategist', 'comms_content_creator',
  'comms_graphic_designer', 'comms_community_manager', 'comms_performance_specialist',
  'comms_pr_manager', 'comms_influencer_manager', 'comms_marketing_analyst',
  'comms_marketing_ops', 'comms_marketing_intern',
  'knowledge_admin', 'knowledge_manager', 'knowledge_contributor', 'knowledge_viewer',
  'viewer',
] as const;
type ManagedRole = typeof ALL_ROLES[number];

const ROLE_META: Record<string, { label: string; color: string; portal: string }> = {
  client:                  { label: 'EPR Portal',        color: 'bg-blue-500/15 text-blue-300 border-blue-500/30',       portal: '/portal'      },
  partner:                 { label: 'Partner Portal',    color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', portal: '/partner'     },
  cepc:                    { label: 'CEPC Portal',       color: 'bg-violet-500/15 text-violet-300 border-violet-500/30', portal: '/cepc'        },
  recycler:                { label: 'Recycler Portal',   color: 'bg-teal-500/15 text-teal-300 border-teal-500/30',       portal: '/recycler'    },
  telecaller:              { label: 'Telecalling',       color: 'bg-orange-500/15 text-orange-300 border-orange-500/30', portal: '/telecalling' },
  'sales-executive':       { label: 'Sales',             color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',   portal: '/admin'       },
  manager:                 { label: 'Admin Panel',       color: 'bg-rose-500/15 text-rose-300 border-rose-500/30',       portal: '/admin'       },
  user_manager:            { label: 'Access Mgr',        color: 'bg-slate-500/15 text-slate-300 border-slate-500/30',   portal: '/iam'         },
  task_manager:            { label: 'Task Manager',      color: 'bg-orange-500/15 text-orange-300 border-orange-500/30', portal: '/taskmanager' },
  cfo:                     { label: 'Finance — CFO',     color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', portal: '/finance'  },
  finance_executive:       { label: 'Finance Executive', color: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20', portal: '/finance'  },
  academy_director:        { label: 'Academy Director',  color: 'bg-indigo-600/15 text-indigo-300 border-indigo-600/30',  portal: '/academy'   },
  academy_manager:         { label: 'Academy Manager',   color: 'bg-indigo-500/10 text-indigo-200 border-indigo-500/20',  portal: '/academy'   },
  training_program_manager:{ label: 'Program Manager',   color: 'bg-violet-500/15 text-violet-300 border-violet-500/30',  portal: '/academy'   },
  trainer:                 { label: 'Trainer',            color: 'bg-violet-500/10 text-violet-200 border-violet-500/20',  portal: '/academy'   },
  guest_trainer:           { label: 'Guest Trainer',      color: 'bg-purple-500/15 text-purple-300 border-purple-500/30',  portal: '/academy'   },
  partner_trainer:         { label: 'Partner Trainer',    color: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30', portal: '/academy' },
  learner:                 { label: 'Learner',            color: 'bg-sky-500/15 text-sky-300 border-sky-500/30',             portal: '/academy' },
  comms_cmo:               { label: 'CMO',                 color: 'bg-emerald-600/15 text-emerald-300 border-emerald-600/30',  portal: '/comms' },
  comms_brand_manager:     { label: 'Brand Manager',      color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',  portal: '/comms' },
  comms_regional_manager:  { label: 'Regional Mktg Mgr',  color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',  portal: '/comms' },
  comms_campaign_manager:  { label: 'Campaign Manager',   color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',  portal: '/comms' },
  comms_social_media_manager: { label: 'Social Media Mgr', color: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20', portal: '/comms' },
  comms_content_strategist:{ label: 'Content Strategist', color: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',  portal: '/comms' },
  comms_content_creator:   { label: 'Content Creator',    color: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',  portal: '/comms' },
  comms_graphic_designer:  { label: 'Graphic Designer',   color: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',  portal: '/comms' },
  comms_community_manager: { label: 'Community Manager',  color: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',  portal: '/comms' },
  comms_performance_specialist: { label: 'Performance Spec', color: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20', portal: '/comms' },
  comms_pr_manager:        { label: 'PR Manager',         color: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',  portal: '/comms' },
  comms_influencer_manager:{ label: 'Influencer Manager', color: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',  portal: '/comms' },
  comms_marketing_analyst: { label: 'Marketing Analyst',  color: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',  portal: '/comms' },
  comms_marketing_ops:     { label: 'Marketing Ops',      color: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',  portal: '/comms' },
  comms_marketing_intern:  { label: 'Mktg Intern',        color: 'bg-emerald-400/10 text-emerald-200 border-emerald-400/20',  portal: '/comms' },
  knowledge_admin:         { label: 'Knowledge Admin',    color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',           portal: '/knowledge' },
  knowledge_manager:       { label: 'Knowledge Manager',  color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',           portal: '/knowledge' },
  knowledge_contributor:   { label: 'Knowledge Contributor', color: 'bg-cyan-500/10 text-cyan-200 border-cyan-500/20',        portal: '/knowledge' },
  knowledge_viewer:        { label: 'Knowledge Viewer',   color: 'bg-cyan-500/10 text-cyan-200 border-cyan-500/20',           portal: '/knowledge' },
  viewer:                  { label: 'Viewer',             color: 'bg-slate-600/15 text-slate-400 border-slate-600/30',     portal: ''           },
};

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDateTime(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' +
    dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function initials(name?: string | null, email?: string | null) {
  if (name) return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (email || '?')[0].toUpperCase();
}

// ─── Types for manager assignment ────────────────────────────────────────────

interface ManagerOption { id: string; full_name: string | null; email: string | null; }
interface AssignData {
  client_company: { id: string; name: string | null; assigned_manager_id: string | null } | null;
  assigned_manager: ManagerOption | null;
  managers: ManagerOption[];
}

// ─── Edit Drawer ─────────────────────────────────────────────────────────────

type DrawerTab = 'profile' | 'access' | 'assign' | 'clients' | 'academy' | 'partner-support' | 'danger';

// ─── Types for a manager's linked clients ────────────────────────────────────

interface ManagedClient {
  id: string;
  company_name: string | null;
  full_name: string | null;
  status: string | null;
  current_manager_id: string | null;
  current_manager_name: string | null;
}

function EditDrawer({
  user,
  onClose,
  onUpdated,
}: {
  user: IamUser;
  onClose: () => void;
  onUpdated: (updated: Partial<IamUser>) => void;
}) {
  const showAssignTab  = user.role === 'client';
  const showClientsTab = user.role === 'manager';
  const showAcademyTab = user.role === 'client';
  const showPartnerSupportTab = user.role === 'partner';
  const [tab, setTab] = useState<DrawerTab>('profile');
  const [form, setForm] = useState({
    full_name: user.full_name || '',
    company_name: user.company_name || '',
    phone: user.phone || '',
    role: user.role,
    notes: user.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pwSent, setPwSent] = useState(false);

  // ── Direct password change (operator picks the new password) ──────────────
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [forcePwChange, setForcePwChange] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // ── Manager assignment state (client users only) ──────────────────────────
  const [assignData, setAssignData] = useState<AssignData | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedMgrId, setSelectedMgrId] = useState<string>('');
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignMsg, setAssignMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // ── Managed-clients state (manager users only) ────────────────────────────
  const [managedClients, setManagedClients] = useState<ManagedClient[] | null>(null);
  const [managedLoading, setManagedLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState<ManagedClient[]>([]);
  const [clientSearching, setClientSearching] = useState(false);
  const [linkBusyId, setLinkBusyId] = useState<string | null>(null);
  const [managedMsg, setManagedMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // ── Academy manager assignment state (client users only) ─────────────────
  interface AcademyAssignData {
    client_company: { id: string; name: string | null; academy_manager_id: string | null } | null;
    assigned_academy_manager: { id: string; full_name: string | null; email: string | null } | null;
    academy_managers: { id: string; full_name: string | null; email: string | null }[];
  }
  const [academyData,    setAcademyData]    = useState<AcademyAssignData | null>(null);
  const [academyLoading, setAcademyLoading] = useState(false);
  const [selectedAcadMgrId, setSelectedAcadMgrId] = useState<string>('');
  const [academySaving,  setAcademySaving]  = useState(false);
  const [academyMsg,     setAcademyMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Load academy assignment when the academy tab is first opened
  useEffect(() => {
    if (tab !== 'academy' || academyData || academyLoading) return;
    setAcademyLoading(true);
    fetch(`/api/iam/users/${user.id}/academy-assignment`)
      .then(r => r.json())
      .then((d: AcademyAssignData) => {
        setAcademyData(d);
        setSelectedAcadMgrId(d.assigned_academy_manager?.id || '');
      })
      .catch(() => setAcademyMsg({ type: 'err', text: 'Failed to load academy assignment data' }))
      .finally(() => setAcademyLoading(false));
  }, [tab, user.id, academyData, academyLoading]);

  async function saveAcademyAssignment() {
    setAcademySaving(true);
    setAcademyMsg(null);
    try {
      const res = await fetch(`/api/iam/users/${user.id}/academy-assignment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academy_manager_id: selectedAcadMgrId || null }),
      });
      const data = await res.json();
      if (!res.ok) { setAcademyMsg({ type: 'err', text: data.error || 'Assignment failed' }); return; }
      trackEvent('IAM Academy Manager Assigned', { assigned: Boolean(selectedAcadMgrId) });
      const newMgr = academyData?.academy_managers.find(m => m.id === selectedAcadMgrId) || null;
      setAcademyData(prev => prev ? {
        ...prev,
        assigned_academy_manager: newMgr,
        client_company: prev.client_company
          ? { ...prev.client_company, academy_manager_id: selectedAcadMgrId || null }
          : null,
      } : null);
      setAcademyMsg({ type: 'ok', text: selectedAcadMgrId ? `Assigned to ${newMgr?.full_name || newMgr?.email || 'academy manager'}` : 'Academy manager unassigned' });
    } finally { setAcademySaving(false); }
  }

  // ── Partner support assignment state (partner users only) ────────────────
  interface PartnerAssignData {
    partner_company: { id: string; name: string | null; portal_user_id: string | null; csm_id: string | null } | null;
    assigned_portal_user: ManagerOption | null;
    assigned_csm: ManagerOption | null;
    portal_users: ManagerOption[];
    csm_candidates: ManagerOption[];
  }
  const [partnerAssignData,    setPartnerAssignData]    = useState<PartnerAssignData | null>(null);
  const [partnerAssignLoading, setPartnerAssignLoading] = useState(false);
  const [selectedPortalUserId, setSelectedPortalUserId] = useState<string>('');
  const [selectedCsmId,        setSelectedCsmId]        = useState<string>('');
  const [portalUserSaving,     setPortalUserSaving]     = useState(false);
  const [csmSaving,            setCsmSaving]            = useState(false);
  const [portalUserMsg,        setPortalUserMsg]        = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [csmMsg,                setCsmMsg]              = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Load partner support assignments when the tab is first opened
  useEffect(() => {
    if (tab !== 'partner-support' || partnerAssignData || partnerAssignLoading) return;
    setPartnerAssignLoading(true);
    fetch(`/api/iam/users/${user.id}/partner-assignments`)
      .then(r => r.json())
      .then((d: PartnerAssignData) => {
        setPartnerAssignData(d);
        setSelectedPortalUserId(d.assigned_portal_user?.id || '');
        setSelectedCsmId(d.assigned_csm?.id || '');
      })
      .catch(() => setPortalUserMsg({ type: 'err', text: 'Failed to load partner support data' }))
      .finally(() => setPartnerAssignLoading(false));
  }, [tab, user.id, partnerAssignData, partnerAssignLoading]);

  async function savePartnerField(field: 'portal_user_id' | 'csm_id') {
    const setSaving = field === 'portal_user_id' ? setPortalUserSaving : setCsmSaving;
    const setMsg = field === 'portal_user_id' ? setPortalUserMsg : setCsmMsg;
    const selectedId = field === 'portal_user_id' ? selectedPortalUserId : selectedCsmId;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/iam/users/${user.id}/partner-assignments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value: selectedId || null }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: 'err', text: data.error || 'Assignment failed' }); return; }
      trackEvent('Partner Assignment Updated', { field, assigned: Boolean(selectedId) });
      const candidates = field === 'portal_user_id' ? partnerAssignData?.portal_users : partnerAssignData?.csm_candidates;
      const newPerson = candidates?.find(m => m.id === selectedId) || null;
      const label = field === 'portal_user_id' ? 'Portal User' : 'Customer Success Manager';
      setPartnerAssignData(prev => prev ? {
        ...prev,
        ...(field === 'portal_user_id' ? { assigned_portal_user: newPerson } : { assigned_csm: newPerson }),
        partner_company: prev.partner_company ? { ...prev.partner_company, [field]: selectedId || null } : null,
      } : null);
      setMsg({ type: 'ok', text: selectedId ? `Assigned to ${newPerson?.full_name || newPerson?.email || label}` : `${label} unassigned` });
    } finally { setSaving(false); }
  }

  // Load assignments when the assign tab is first opened
  useEffect(() => {
    if (tab !== 'assign' || assignData || assignLoading) return;
    setAssignLoading(true);
    fetch(`/api/iam/users/${user.id}/assignments`)
      .then(r => r.json())
      .then((d: AssignData) => {
        setAssignData(d);
        setSelectedMgrId(d.assigned_manager?.id || '');
      })
      .catch(() => setAssignMsg({ type: 'err', text: 'Failed to load assignment data' }))
      .finally(() => setAssignLoading(false));
  }, [tab, user.id, assignData, assignLoading]);

  async function saveAssignment() {
    setAssignSaving(true);
    setAssignMsg(null);
    try {
      const res = await fetch(`/api/iam/users/${user.id}/assignments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manager_id: selectedMgrId || null }),
      });
      const data = await res.json();
      if (!res.ok) { setAssignMsg({ type: 'err', text: data.error || 'Assignment failed' }); return; }
      trackEvent('IAM Manager Assigned', { assigned: Boolean(selectedMgrId) });
      const newMgr = assignData?.managers.find(m => m.id === selectedMgrId) || null;
      setAssignData(prev => prev ? {
        ...prev,
        assigned_manager: newMgr,
        client_company: prev.client_company
          ? { ...prev.client_company, assigned_manager_id: selectedMgrId || null }
          : null,
      } : null);
      setAssignMsg({ type: 'ok', text: selectedMgrId ? `Assigned to ${newMgr?.full_name || newMgr?.email || 'manager'}` : 'Manager unassigned' });
    } finally { setAssignSaving(false); }
  }

  // Load the manager's linked clients when the Clients tab is first opened
  useEffect(() => {
    if (tab !== 'clients' || managedClients !== null || managedLoading) return;
    setManagedLoading(true);
    fetch(`/api/iam/users/${user.id}/managed-clients`)
      .then(r => r.json())
      .then((d: { assigned: ManagedClient[] }) => setManagedClients(d.assigned || []))
      .catch(() => setManagedMsg({ type: 'err', text: 'Failed to load linked clients' }))
      .finally(() => setManagedLoading(false));
  }, [tab, user.id, managedClients, managedLoading]);

  // Debounced client search for the link picker
  useEffect(() => {
    if (tab !== 'clients') return;
    const q = clientSearch.trim();
    if (!q) { setClientResults([]); setClientSearching(false); return; }
    setClientSearching(true);
    const timer = setTimeout(() => {
      fetch(`/api/iam/users/${user.id}/managed-clients?search=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then((d: { results: ManagedClient[] }) => setClientResults(d.results || []))
        .catch(() => setClientResults([]))
        .finally(() => setClientSearching(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [clientSearch, tab, user.id]);

  async function linkClient(client: ManagedClient) {
    setLinkBusyId(client.id);
    setManagedMsg(null);
    try {
      const res = await fetch(`/api/iam/users/${user.id}/managed-clients`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: client.id, action: 'link' }),
      });
      const data = await res.json();
      if (!res.ok) { setManagedMsg({ type: 'err', text: data.error || 'Failed to link client' }); return; }
      trackEvent('IAM Client Linked', {});
      const label = client.company_name || client.full_name || 'Client';
      setManagedClients(prev => {
        const next = (prev || []).filter(c => c.id !== client.id);
        return [...next, { ...client, current_manager_id: user.id, current_manager_name: user.full_name || null }]
          .sort((a, b) => (a.company_name || a.full_name || '').localeCompare(b.company_name || b.full_name || ''));
      });
      setClientResults(prev => prev.filter(c => c.id !== client.id));
      setManagedMsg({ type: 'ok', text: `${label} linked` });
    } finally { setLinkBusyId(null); }
  }

  async function unlinkClient(client: ManagedClient) {
    setLinkBusyId(client.id);
    setManagedMsg(null);
    try {
      const res = await fetch(`/api/iam/users/${user.id}/managed-clients`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: client.id, action: 'unlink' }),
      });
      const data = await res.json();
      if (!res.ok) { setManagedMsg({ type: 'err', text: data.error || 'Failed to unlink client' }); return; }
      trackEvent('IAM Client Unlinked', {});
      const label = client.company_name || client.full_name || 'Client';
      setManagedClients(prev => (prev || []).filter(c => c.id !== client.id));
      setManagedMsg({ type: 'ok', text: `${label} unlinked` });
    } finally { setLinkBusyId(null); }
  }

  const roleMeta = ROLE_META[user.role] || ROLE_META['viewer'];

  async function saveProfile() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/iam/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: 'err', text: data.error || 'Update failed' }); return; }
      setMsg({ type: 'ok', text: 'Changes saved' });
      onUpdated({ ...form });
    } finally { setSaving(false); }
  }

  async function handleBan() {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch(`/api/iam/users/${user.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: banReason }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: 'err', text: data.error || 'Ban failed' }); return; }
      setMsg({ type: 'ok', text: 'User banned' });
      onUpdated({ is_banned: true, banned_reason: banReason });
    } finally { setSaving(false); }
  }

  async function handleUnban() {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch(`/api/iam/users/${user.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unban: true }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: 'err', text: data.error || 'Unban failed' }); return; }
      setMsg({ type: 'ok', text: 'User reinstated' });
      onUpdated({ is_banned: false, banned_reason: null });
    } finally { setSaving(false); }
  }

  async function handlePasswordReset() {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch(`/api/iam/users/${user.id}/reset-password`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: 'err', text: data.error || 'Reset failed' }); return; }
      setPwSent(true);
      setMsg({ type: 'ok', text: 'Password reset email sent' });
    } catch {
      setMsg({ type: 'err', text: 'Unable to send reset email. Please try again.' });
    } finally { setSaving(false); }
  }

  async function handleSetPassword() {
    setMsg(null);
    if (newPw.length < 8) { setMsg({ type: 'err', text: 'Password must be at least 8 characters.' }); return; }
    if (newPw !== confirmPw) { setMsg({ type: 'err', text: 'Passwords do not match.' }); return; }
    setPwSaving(true);
    try {
      const res = await fetch(`/api/iam/users/${user.id}/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPw, force_change: forcePwChange }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: 'err', text: data.error || 'Failed to set password' }); return; }
      setNewPw(''); setConfirmPw('');
      setMsg({ type: 'ok', text: forcePwChange ? 'Password set — user must change it on next login' : 'Password updated' });
    } finally { setPwSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-[480px] flex-col bg-[#0c1022] border-l border-slate-800/60 shadow-2xl overflow-hidden">

        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-300 select-none">
              {initials(user.full_name, user.email)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">{user.full_name || user.email || 'Unknown'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${roleMeta.color}`}>
                  {roleMeta.label}
                </span>
                {user.is_banned && (
                  <span className="rounded border border-rose-500/30 bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">BANNED</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800/60 shrink-0">
          {(
            [
              { id: 'profile' as DrawerTab, label: 'Profile' },
              { id: 'access'  as DrawerTab, label: 'Access' },
              ...(showAssignTab  ? [{ id: 'assign'  as DrawerTab, label: 'Manager' }] : []),
              ...(showClientsTab ? [{ id: 'clients' as DrawerTab, label: 'Clients' }] : []),
              ...(showAcademyTab ? [{ id: 'academy' as DrawerTab, label: 'Academy' }] : []),
              ...(showPartnerSupportTab ? [{ id: 'partner-support' as DrawerTab, label: 'Support' }] : []),
              { id: 'danger'  as DrawerTab, label: 'Danger' },
            ]
          ).map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setMsg(null); }}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                tab === t.id ? 'border-b-2 border-violet-500 text-violet-400' : 'text-slate-500 hover:text-slate-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {msg && (
          <div className={`mx-5 mt-3 rounded-lg px-3 py-2 text-xs font-medium ${
            msg.type === 'ok' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
          }`}>
            {msg.text}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {tab === 'profile' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 p-3 space-y-1">
                <p className="text-[10px] text-slate-500">Email</p>
                <p className="text-sm text-slate-300">{user.email || '—'}</p>
                <p className="text-[10px] text-slate-600">Cannot be changed here</p>
              </div>
              <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 p-3 space-y-1">
                <p className="text-[10px] text-slate-500">User ID</p>
                <p className="text-xs font-mono text-slate-500 break-all">{user.id}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Full Name</label>
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Company Name</label>
                <input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Internal Notes</label>
                <textarea value={form.notes} rows={2} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition" />
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800/60 bg-slate-900/50 p-3">
                <div><p className="text-[10px] text-slate-500">Created</p><p className="text-xs text-slate-400">{formatDate(user.created_at)}</p></div>
                <div><p className="text-[10px] text-slate-500">Last Sign In</p><p className="text-xs text-slate-400">{formatDateTime(user.last_sign_in_at)}</p></div>
              </div>
              <button onClick={saveProfile} disabled={saving}
                className="w-full rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}

          {tab === 'access' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Portal Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 transition cursor-pointer">
                  {ALL_ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_META[r]?.label || r} ({r})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-600">Changing role changes which portal this user can access.</p>
              </div>

              <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 p-3 space-y-2">
                <p className="text-xs font-semibold text-slate-400">Portal Access</p>
                <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${ROLE_META[form.role]?.color || ''}`}>
                  <span className="text-sm font-semibold">{ROLE_META[form.role]?.label || form.role}</span>
                  <span className="text-[11px] opacity-70">{ROLE_META[form.role]?.portal}</span>
                </div>
              </div>

              <button onClick={saveProfile} disabled={saving || form.role === user.role}
                className="w-full rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition">
                {saving ? 'Saving…' : form.role === user.role ? 'No Role Change' : `Change Role to ${ROLE_META[form.role]?.label || form.role}`}
              </button>

              <div className="border-t border-slate-800/60 pt-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Set New Password</p>
                  <p className="text-[11px] text-slate-600">Directly set a new password for {user.email}</p>
                </div>
                <div className="relative">
                  <input type={showNewPw ? 'text' : 'password'} value={newPw} minLength={8}
                    onChange={e => setNewPw(e.target.value)} placeholder="New password (min 8 chars)"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition" />
                  <button type="button" onClick={() => setShowNewPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                      {showNewPw
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                      }
                    </svg>
                  </button>
                </div>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition" />
                {confirmPw && newPw && confirmPw !== newPw && (
                  <p className="text-[11px] text-rose-400">Passwords do not match</p>
                )}
                <label className="flex items-center gap-2 text-[11px] text-slate-400 select-none cursor-pointer">
                  <input type="checkbox" checked={forcePwChange} onChange={e => setForcePwChange(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-violet-600 focus:ring-violet-500" />
                  Require user to change password on next login
                </label>
                <button onClick={handleSetPassword} disabled={pwSaving || newPw.length < 8 || newPw !== confirmPw}
                  className="w-full rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 py-2 text-xs font-semibold text-white transition">
                  {pwSaving ? 'Setting…' : 'Set Password'}
                </button>
              </div>

              <div className="border-t border-slate-800/60 pt-4 space-y-2">
                <p className="text-xs font-semibold text-slate-400">Password Reset Email</p>
                <p className="text-[11px] text-slate-600">Sends a self-service reset link to {user.email}</p>
                <button onClick={handlePasswordReset} disabled={saving || pwSent}
                  className="w-full rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 py-2 text-xs font-semibold text-amber-300 transition">
                  {pwSent ? '✓ Reset Email Sent' : saving ? 'Sending…' : 'Send Password Reset Email'}
                </button>
              </div>
            </div>
          )}

          {tab === 'assign' && (
            <div className="space-y-4">

              {/* Loading skeleton */}
              {assignLoading && (
                <div className="space-y-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-800/60" />
                  ))}
                </div>
              )}

              {!assignLoading && assignData && (
                <>
                  {/* Linked company */}
                  <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 p-3 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Linked Company</p>
                    {assignData.client_company ? (
                      <p className="text-sm font-medium text-slate-200">
                        {assignData.client_company.name || <span className="italic text-slate-500">Unnamed company</span>}
                      </p>
                    ) : (
                      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5">
                        <p className="text-xs text-amber-300 font-medium">No company linked</p>
                        <p className="text-[10px] text-amber-400/70 mt-0.5">
                          Go to Admin → CRM → Clients to link a company to this portal user first.
                        </p>
                      </div>
                    )}
                  </div>

                  {assignData.client_company && (
                    <>
                      {/* Current manager */}
                      <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 p-3 space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Current Compliance Manager</p>
                        {assignData.assigned_manager ? (
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-xs font-bold text-rose-300">
                              {(assignData.assigned_manager.full_name || assignData.assigned_manager.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-200 truncate">
                                {assignData.assigned_manager.full_name || assignData.assigned_manager.email}
                              </p>
                              {assignData.assigned_manager.email && assignData.assigned_manager.full_name && (
                                <p className="text-[11px] text-slate-500 truncate">{assignData.assigned_manager.email}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic">None assigned</p>
                        )}
                      </div>

                      {/* Manager selector */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          {assignData.assigned_manager ? 'Change Manager' : 'Assign Manager'}
                        </label>
                        <select
                          value={selectedMgrId}
                          onChange={e => { setSelectedMgrId(e.target.value); setAssignMsg(null); }}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 transition cursor-pointer"
                        >
                          <option value="">— No manager —</option>
                          {assignData.managers.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.full_name || m.email || m.id}
                              {m.email && m.full_name ? ` (${m.email})` : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-600">
                          Only users with Manager or Admin role appear here.
                        </p>
                      </div>

                      {/* Save */}
                      <button
                        onClick={saveAssignment}
                        disabled={assignSaving || selectedMgrId === (assignData.assigned_manager?.id || '')}
                        className="w-full rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition"
                      >
                        {assignSaving
                          ? 'Saving…'
                          : selectedMgrId === (assignData.assigned_manager?.id || '')
                          ? 'No Change'
                          : selectedMgrId
                          ? `Assign ${assignData.managers.find(m => m.id === selectedMgrId)?.full_name || 'Manager'}`
                          : 'Remove Manager Assignment'}
                      </button>

                      {/* Success / error feedback — rendered right below the button */}
                      {assignMsg && (
                        <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium ${
                          assignMsg.type === 'ok'
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                        }`}>
                          {assignMsg.type === 'ok' ? (
                            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          {assignMsg.text}
                        </div>
                      )}

                      {/* Unassign shortcut */}
                      {assignData.assigned_manager && selectedMgrId && (
                        <button
                          onClick={() => setSelectedMgrId('')}
                          className="w-full rounded-lg border border-slate-700 py-2 text-xs text-slate-500 hover:text-slate-300 hover:border-slate-600 transition"
                        >
                          Clear selection (unassign manager)
                        </button>
                      )}
                    </>
                  )}

                  {/* Error for missing company case */}
                  {!assignData.client_company && assignMsg && (
                    <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium ${
                      assignMsg.type === 'ok'
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}>
                      {assignMsg.text}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'clients' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Compliance Manager</p>
                <p className="text-sm font-medium text-slate-200">{user.full_name || user.email}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Link client companies to this manager. Linked clients appear in the manager portal under My Clients.
                </p>
              </div>

              {/* Feedback */}
              {managedMsg && (
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium ${
                  managedMsg.type === 'ok'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                }`}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={managedMsg.type === 'ok' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} />
                  </svg>
                  {managedMsg.text}
                </div>
              )}

              {/* Loading skeleton */}
              {managedLoading && (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-800/60" />)}
                </div>
              )}

              {!managedLoading && managedClients !== null && (
                <>
                  {/* Assigned clients */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Assigned Clients ({managedClients.length})
                    </p>
                    {managedClients.length === 0 ? (
                      <p className="rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-3 text-xs text-slate-500 italic">
                        No clients linked yet. Search below to link one.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {managedClients.map(c => (
                          <div key={c.id} className="flex items-center gap-2.5 rounded-lg border border-slate-800/60 bg-slate-900/50 px-3 py-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-xs font-bold text-rose-300">
                              {(c.company_name || c.full_name || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-200 truncate">
                                {c.company_name || c.full_name || <span className="italic text-slate-500">Unnamed</span>}
                              </p>
                              {c.status && <p className="text-[10px] text-slate-500">{c.status}</p>}
                            </div>
                            <button
                              onClick={() => unlinkClient(c)}
                              disabled={linkBusyId === c.id}
                              className="shrink-0 rounded-md border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-50 transition"
                            >
                              {linkBusyId === c.id ? '…' : 'Unlink'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Link new client */}
                  <div className="space-y-1.5 border-t border-slate-800/60 pt-4">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Link a Client</label>
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={e => setClientSearch(e.target.value)}
                      placeholder="Search client by company or contact name…"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                    />

                    {clientSearching && (
                      <p className="text-[11px] text-slate-500">Searching…</p>
                    )}

                    {!clientSearching && clientSearch.trim() && clientResults.length === 0 && (
                      <p className="text-[11px] text-slate-600">No matching clients found.</p>
                    )}

                    {clientResults.length > 0 && (
                      <div className="space-y-1.5">
                        {clientResults.map(c => (
                          <div key={c.id} className="flex items-center gap-2.5 rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-200 truncate">
                                {c.company_name || c.full_name || <span className="italic text-slate-500">Unnamed</span>}
                              </p>
                              {c.current_manager_id ? (
                                <p className="text-[10px] text-amber-400/80">
                                  Currently: {c.current_manager_name || 'another manager'} — linking reassigns
                                </p>
                              ) : (
                                <p className="text-[10px] text-slate-500">No manager assigned</p>
                              )}
                            </div>
                            <button
                              onClick={() => linkClient(c)}
                              disabled={linkBusyId === c.id}
                              className="shrink-0 rounded-md bg-violet-600 hover:bg-violet-700 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50 transition"
                            >
                              {linkBusyId === c.id ? '…' : c.current_manager_id ? 'Reassign' : 'Link'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'academy' && (
            <div className="space-y-4">
              {academyLoading && (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-800/60" />)}
                </div>
              )}

              {!academyLoading && (
                <>
                  {/* Linked company check */}
                  {!academyData?.client_company ? (
                    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                      <p className="text-xs text-amber-300 font-medium">No company linked</p>
                      <p className="text-[10px] text-amber-400/70 mt-0.5">
                        Link a company in Admin → CRM → Clients first.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Company row */}
                      <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 p-3 space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Linked Company</p>
                        <p className="text-sm font-medium text-slate-200">
                          {academyData.client_company.name || <span className="italic text-slate-500">Unnamed company</span>}
                        </p>
                      </div>

                      {/* Current academy manager */}
                      <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 p-3 space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Current Academy Manager</p>
                        {academyData.assigned_academy_manager ? (
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
                              {(academyData.assigned_academy_manager.full_name || academyData.assigned_academy_manager.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-200 truncate">
                                {academyData.assigned_academy_manager.full_name || academyData.assigned_academy_manager.email}
                              </p>
                              {academyData.assigned_academy_manager.email && academyData.assigned_academy_manager.full_name && (
                                <p className="text-[11px] text-slate-500 truncate">{academyData.assigned_academy_manager.email}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic">None assigned</p>
                        )}
                      </div>

                      {/* Academy manager selector */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          {academyData.assigned_academy_manager ? 'Change Academy Manager' : 'Assign Academy Manager'}
                        </label>
                        <select
                          value={selectedAcadMgrId}
                          onChange={e => { setSelectedAcadMgrId(e.target.value); setAcademyMsg(null); }}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                        >
                          <option value="">— No academy manager —</option>
                          {(academyData?.academy_managers || []).map(m => (
                            <option key={m.id} value={m.id}>
                              {m.full_name || m.email || m.id}
                              {m.email && m.full_name ? ` (${m.email})` : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-600">
                          Only Academy Director, Academy Manager, and Admin roles appear here.
                        </p>
                      </div>

                      <button
                        onClick={saveAcademyAssignment}
                        disabled={academySaving || selectedAcadMgrId === (academyData.assigned_academy_manager?.id || '')}
                        className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition"
                      >
                        {academySaving
                          ? 'Saving…'
                          : selectedAcadMgrId === (academyData.assigned_academy_manager?.id || '')
                          ? 'No Change'
                          : selectedAcadMgrId
                          ? `Assign ${academyData.academy_managers.find(m => m.id === selectedAcadMgrId)?.full_name || 'Academy Manager'}`
                          : 'Remove Academy Manager'}
                      </button>

                      {academyMsg && (
                        <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium ${
                          academyMsg.type === 'ok'
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                        }`}>
                          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={academyMsg.type === 'ok' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} />
                          </svg>
                          {academyMsg.text}
                        </div>
                      )}

                      {academyData.assigned_academy_manager && selectedAcadMgrId && (
                        <button
                          onClick={() => setSelectedAcadMgrId('')}
                          className="w-full rounded-lg border border-slate-700 py-2 text-xs text-slate-500 hover:text-slate-300 hover:border-slate-600 transition"
                        >
                          Clear selection (unassign academy manager)
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'partner-support' && (
            <div className="space-y-4">
              {partnerAssignLoading && (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-800/60" />)}
                </div>
              )}

              {!partnerAssignLoading && (
                <>
                  {!partnerAssignData?.partner_company ? (
                    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                      <p className="text-xs text-amber-300 font-medium">No company linked</p>
                      <p className="text-[10px] text-amber-400/70 mt-0.5">
                        Link a company in Admin → CRM → Partners first.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Company row */}
                      <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 p-3 space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Linked Company</p>
                        <p className="text-sm font-medium text-slate-200">
                          {partnerAssignData.partner_company.name || <span className="italic text-slate-500">Unnamed company</span>}
                        </p>
                      </div>

                      {/* ── Portal User ── */}
                      <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 p-3 space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Current Portal User</p>
                        {partnerAssignData.assigned_portal_user ? (
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-300">
                              {(partnerAssignData.assigned_portal_user.full_name || partnerAssignData.assigned_portal_user.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-200 truncate">
                                {partnerAssignData.assigned_portal_user.full_name || partnerAssignData.assigned_portal_user.email}
                              </p>
                              {partnerAssignData.assigned_portal_user.email && partnerAssignData.assigned_portal_user.full_name && (
                                <p className="text-[11px] text-slate-500 truncate">{partnerAssignData.assigned_portal_user.email}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic">None assigned</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          {partnerAssignData.assigned_portal_user ? 'Change Portal User' : 'Assign Portal User'}
                        </label>
                        <select
                          value={selectedPortalUserId}
                          onChange={e => { setSelectedPortalUserId(e.target.value); setPortalUserMsg(null); }}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 transition cursor-pointer"
                        >
                          <option value="">— No portal user —</option>
                          {(partnerAssignData?.portal_users || []).map(m => (
                            <option key={m.id} value={m.id}>
                              {m.full_name || m.email || m.id}
                              {m.email && m.full_name ? ` (${m.email})` : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-600">
                          Only Manager, Access Mgr, and Admin roles appear here. Helps the partner with portal how-to questions.
                        </p>
                      </div>

                      <button
                        onClick={() => savePartnerField('portal_user_id')}
                        disabled={portalUserSaving || selectedPortalUserId === (partnerAssignData.assigned_portal_user?.id || '')}
                        className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition"
                      >
                        {portalUserSaving
                          ? 'Saving…'
                          : selectedPortalUserId === (partnerAssignData.assigned_portal_user?.id || '')
                          ? 'No Change'
                          : selectedPortalUserId
                          ? `Assign ${partnerAssignData.portal_users.find(m => m.id === selectedPortalUserId)?.full_name || 'Portal User'}`
                          : 'Remove Portal User'}
                      </button>

                      {portalUserMsg && (
                        <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium ${
                          portalUserMsg.type === 'ok'
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                        }`}>
                          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={portalUserMsg.type === 'ok' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} />
                          </svg>
                          {portalUserMsg.text}
                        </div>
                      )}

                      {partnerAssignData.assigned_portal_user && selectedPortalUserId && (
                        <button
                          onClick={() => setSelectedPortalUserId('')}
                          className="w-full rounded-lg border border-slate-700 py-2 text-xs text-slate-500 hover:text-slate-300 hover:border-slate-600 transition"
                        >
                          Clear selection (unassign portal user)
                        </button>
                      )}

                      <div className="border-t border-slate-800/60 pt-4" />

                      {/* ── Customer Success Manager ── */}
                      <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 p-3 space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Current Customer Success Manager</p>
                        {partnerAssignData.assigned_csm ? (
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300">
                              {(partnerAssignData.assigned_csm.full_name || partnerAssignData.assigned_csm.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-200 truncate">
                                {partnerAssignData.assigned_csm.full_name || partnerAssignData.assigned_csm.email}
                              </p>
                              {partnerAssignData.assigned_csm.email && partnerAssignData.assigned_csm.full_name && (
                                <p className="text-[11px] text-slate-500 truncate">{partnerAssignData.assigned_csm.email}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic">None assigned</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          {partnerAssignData.assigned_csm ? 'Change Customer Success Manager' : 'Assign Customer Success Manager'}
                        </label>
                        <select
                          value={selectedCsmId}
                          onChange={e => { setSelectedCsmId(e.target.value); setCsmMsg(null); }}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 transition cursor-pointer"
                        >
                          <option value="">— No customer success manager —</option>
                          {(partnerAssignData?.csm_candidates || []).map(m => (
                            <option key={m.id} value={m.id}>
                              {m.full_name || m.email || m.id}
                              {m.email && m.full_name ? ` (${m.email})` : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-600">
                          Only Manager and Admin roles appear here. Helps the partner with business-related questions.
                        </p>
                      </div>

                      <button
                        onClick={() => savePartnerField('csm_id')}
                        disabled={csmSaving || selectedCsmId === (partnerAssignData.assigned_csm?.id || '')}
                        className="w-full rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition"
                      >
                        {csmSaving
                          ? 'Saving…'
                          : selectedCsmId === (partnerAssignData.assigned_csm?.id || '')
                          ? 'No Change'
                          : selectedCsmId
                          ? `Assign ${partnerAssignData.csm_candidates.find(m => m.id === selectedCsmId)?.full_name || 'Customer Success Manager'}`
                          : 'Remove Customer Success Manager'}
                      </button>

                      {csmMsg && (
                        <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium ${
                          csmMsg.type === 'ok'
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                        }`}>
                          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={csmMsg.type === 'ok' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} />
                          </svg>
                          {csmMsg.text}
                        </div>
                      )}

                      {partnerAssignData.assigned_csm && selectedCsmId && (
                        <button
                          onClick={() => setSelectedCsmId('')}
                          className="w-full rounded-lg border border-slate-700 py-2 text-xs text-slate-500 hover:text-slate-300 hover:border-slate-600 transition"
                        >
                          Clear selection (unassign customer success manager)
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'danger' && (
            <div className="space-y-4">
              {user.is_banned ? (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-rose-300">Account Banned</p>
                      {user.banned_reason && <p className="text-xs text-rose-400/80 mt-0.5">Reason: {user.banned_reason}</p>}
                      {user.banned_at && <p className="text-[10px] text-rose-500/70 mt-1">Since {formatDateTime(user.banned_at)}</p>}
                    </div>
                  </div>
                  <button onClick={handleUnban} disabled={saving}
                    className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition">
                    {saving ? 'Processing…' : 'Reinstate Account'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4">
                    <p className="text-sm font-semibold text-rose-300 mb-1">Ban User</p>
                    <p className="text-xs text-slate-500 mb-3">
                      Banning immediately blocks portal login and revokes all active sessions.
                      The account remains in the system and can be reinstated.
                    </p>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Reason (optional)</label>
                      <input
                        value={banReason} onChange={e => setBanReason(e.target.value)}
                        placeholder="e.g. Policy violation, account misuse…"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500 transition"
                      />
                    </div>
                    <button onClick={handleBan} disabled={saving}
                      className="mt-3 w-full rounded-lg bg-rose-700 hover:bg-rose-600 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition">
                      {saving ? 'Processing…' : 'Ban Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  initialUsers: IamUser[];
  totalCount: number;
  currentRole: string;
  currentStatus: string;
  currentSearch: string;
  currentPage: number;
}

export default function UsersClient({ initialUsers, totalCount, currentRole, currentStatus, currentSearch, currentPage }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<IamUser[]>(initialUsers);
  const [search, setSearch] = useState(currentSearch);
  const [roleFilter, setRoleFilter] = useState(currentRole);
  const [statusFilter, setStatusFilter] = useState(currentStatus);
  const [selectedUser, setSelectedUser] = useState<IamUser | null>(null);

  // Debounced push to URL (triggers server refetch)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      router.push(`/iam/users?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync when server-side props change
  useEffect(() => { setUsers(initialUsers); }, [initialUsers]);

  const handleUserUpdated = useCallback((id: string, updates: Partial<IamUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    if (selectedUser?.id === id) setSelectedUser(prev => prev ? { ...prev, ...updates } : null);
  }, [selectedUser]);

  const totalPages = Math.ceil(totalCount / 50);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">All Users</h1>
          <p className="text-sm text-slate-500">{totalCount} users across all portals</p>
        </div>
        <a href="/iam/create"
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-3 py-2 text-sm font-semibold text-white transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create User
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, company, email…"
          className="flex-1 min-w-[200px] rounded-lg border border-slate-700 bg-[#0c1022] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#0c1022] px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500 transition cursor-pointer">
          <option value="">All Roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label || r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#0c1022] px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500 transition cursor-pointer">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Role filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setRoleFilter('')}
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${!roleFilter ? 'border-violet-500 bg-violet-500/15 text-violet-300' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}>
          All
        </button>
        {ALL_ROLES.map(r => (
          <button key={r} onClick={() => setRoleFilter(roleFilter === r ? '' : r)}
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
              roleFilter === r ? `${ROLE_META[r]?.color}` : 'border-slate-700 text-slate-500 hover:border-slate-600'
            }`}>
            {ROLE_META[r]?.label || r}
          </button>
        ))}
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] py-16 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-sm font-medium text-slate-500">No users found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0c1022]">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Portal / Role</th>
                <th className="px-4 py-3 hidden sm:table-cell">Company</th>
                <th className="px-4 py-3 hidden lg:table-cell">Last Sign In</th>
                <th className="px-4 py-3 hidden lg:table-cell">Created</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const meta = ROLE_META[u.role] || ROLE_META['viewer'];
                return (
                  <tr key={u.id}
                    className={`border-b border-slate-800/40 transition-colors hover:bg-slate-800/30 ${u.is_banned ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold select-none ${
                          u.is_banned ? 'bg-rose-500/15 text-rose-400' : 'bg-violet-500/15 text-violet-300'
                        }`}>
                          {initials(u.full_name, u.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate max-w-[160px]">
                            {u.full_name || <span className="italic text-slate-500">No name</span>}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[160px]">{u.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-slate-400 truncate max-w-[150px] block">{u.company_name || '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-500">{formatDateTime(u.last_sign_in_at)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-500">{formatDate(u.created_at)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_banned ? (
                        <span className="inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Page {currentPage} of {totalPages} ({totalCount} total)</span>
          <div className="flex gap-1">
            {currentPage > 1 && (
              <a href={`/iam/users?page=${currentPage - 1}&role=${roleFilter}&status=${statusFilter}&search=${search}`}
                className="rounded border border-slate-700 px-3 py-1.5 hover:bg-slate-800 transition">← Prev</a>
            )}
            {currentPage < totalPages && (
              <a href={`/iam/users?page=${currentPage + 1}&role=${roleFilter}&status=${statusFilter}&search=${search}`}
                className="rounded border border-slate-700 px-3 py-1.5 hover:bg-slate-800 transition">Next →</a>
            )}
          </div>
        </div>
      )}

      {/* Edit drawer */}
      {selectedUser && (
        <EditDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdated={(updates) => handleUserUpdated(selectedUser.id, updates)}
        />
      )}
    </div>
  );
}
