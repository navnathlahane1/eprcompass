'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { tableSourceType } from '@/lib/airtableIntel';

const WA_SOURCE_ID = '994a17f0-ca48-4ef0-9138-22ee1419c1b6';
const LANDING_SOURCE_TYPE = 'landing_page_form';

const AIRTABLE_TABLES = [
  'Companies', 'Contacts', 'Exporters', 'Tamilnadu_Recylers', 'Campaign Activity',
  'Scrape Logs', 'Whatsapp Messages', 'Gujarat', 'Haryana E-Waste', 'Haryana Hazardous Waste',
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh',
];

type SourceTab = 'whatsapp' | 'email' | 'landing' | 'call_blast' | 'sms' | 'airtable';

type StagedRecord = {
  id: string;
  external_record_id: string;
  source_type: string;
  payload: any;
  observed_at: string;
  review_status: 'pending' | 'approved' | 'rejected';
  promoted_company_id: string | null;
};

type GmailAccount = {
  id: string;
  email: string;
  last_synced_at: string | null;
};

type PromoteForm = {
  company_name: string;
  contact_name: string;
  phone: string;
  phone_whatsapp: string;
  email: string;
  industry: string;
  city: string;
  state: string;
  notes: string;
  lead_temperature: string;
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(iso: string | null) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function StagingPageInner() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SourceTab>('whatsapp');
  const [waRecords, setWaRecords] = useState<StagedRecord[]>([]);
  const [emailRecords, setEmailRecords] = useState<StagedRecord[]>([]);
  const [landingRecords, setLandingRecords] = useState<StagedRecord[]>([]);
  const [callBlastRecords, setCallBlastRecords] = useState<StagedRecord[]>([]);
  const [smsRecords, setSmsRecords] = useState<StagedRecord[]>([]);
  const [airtableRecords, setAirtableRecords] = useState<StagedRecord[]>([]);
  const [airtableTable, setAirtableTable] = useState(AIRTABLE_TABLES[0]);
  const [gmailAccounts, setGmailAccounts] = useState<GmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [promoteTarget, setPromoteTarget] = useState<StagedRecord | null>(null);
  const [form, setForm] = useState<PromoteForm>({
    company_name: '', contact_name: '', phone: '', phone_whatsapp: '',
    email: '', industry: '', city: '', state: '', notes: '', lead_temperature: 'Warm',
  });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectingGmail, setConnectingGmail] = useState(false);
  const [toast, setToast] = useState('');

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  const loadWA = useCallback(async () => {
    const { data } = await supabase
      .from('intel_raw_records')
      .select('id, external_record_id, source_type, payload, observed_at, review_status, promoted_company_id')
      .eq('source_id', WA_SOURCE_ID)
      .order('observed_at', { ascending: false });
    setWaRecords((data || []) as StagedRecord[]);
  }, []);

  const loadEmail = useCallback(async () => {
    const { data } = await supabase
      .from('intel_raw_records')
      .select('id, external_record_id, source_type, payload, observed_at, review_status, promoted_company_id')
      .eq('source_type', 'email_gmail')
      .order('observed_at', { ascending: false });
    setEmailRecords((data || []) as StagedRecord[]);
  }, []);

  const loadLanding = useCallback(async () => {
    const { data } = await supabase
      .from('intel_raw_records')
      .select('id, external_record_id, source_type, payload, observed_at, review_status, promoted_company_id')
      .eq('source_type', LANDING_SOURCE_TYPE)
      .order('observed_at', { ascending: false });
    setLandingRecords((data || []) as StagedRecord[]);
  }, []);

  const loadCallBlast = useCallback(async () => {
    const { data } = await supabase
      .from('intel_raw_records')
      .select('id, external_record_id, source_type, payload, observed_at, review_status, promoted_company_id')
      .eq('source_type', 'call_blast')
      .order('observed_at', { ascending: false });
    setCallBlastRecords((data || []) as StagedRecord[]);
  }, []);

  const loadSms = useCallback(async () => {
    const { data } = await supabase
      .from('intel_raw_records')
      .select('id, external_record_id, source_type, payload, observed_at, review_status, promoted_company_id')
      .eq('source_type', 'sms')
      .order('observed_at', { ascending: false });
    setSmsRecords((data || []) as StagedRecord[]);
  }, []);

  const loadAirtable = useCallback(async () => {
    const { data } = await supabase
      .from('intel_raw_records')
      .select('id, external_record_id, source_type, payload, observed_at, review_status, promoted_company_id')
      .eq('source_type', tableSourceType(airtableTable))
      .order('observed_at', { ascending: false });
    setAirtableRecords((data || []) as StagedRecord[]);
  }, [airtableTable]);

  const loadGmailAccounts = useCallback(async () => {
    const token = await getToken();
    const res = await fetch('/api/intel/gmail/accounts', {
      headers: { authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setGmailAccounts(data.accounts || []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadWA(), loadEmail(), loadLanding(), loadCallBlast(), loadSms(), loadAirtable(), loadGmailAccounts()]);
    setLoading(false);
  }, [loadWA, loadEmail, loadLanding, loadCallBlast, loadSms, loadAirtable, loadGmailAccounts]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Reload when the selected Airtable table changes
  useEffect(() => { loadAirtable(); }, [loadAirtable]);

  // Handle callback from Gmail OAuth
  useEffect(() => {
    const gmail = searchParams?.get('gmail');
    if (gmail === 'connected') {
      showToast('Gmail connected! You can now sync email leads.');
      setActiveTab('email');
      loadGmailAccounts();
    } else if (gmail === 'denied') {
      showToast('Gmail access was denied.');
    } else if (gmail === 'error') {
      showToast('Gmail connection failed. Please try again.');
    }
  }, [searchParams, loadGmailAccounts]);

  async function handleConnectGmail() {
    setConnectingGmail(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { showToast('Not logged in'); setConnectingGmail(false); return; }
    const token = await getToken();
    const res = await fetch('/api/intel/gmail/auth-url', {
      headers: { authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.url) {
      // Pass user id as base64 state so callback can identify who connected
      const stateParam = Buffer.from(user.id).toString('base64');
      window.location.href = data.url + `&state=${stateParam}`;
    } else {
      showToast('Could not get Gmail auth URL');
      setConnectingGmail(false);
    }
  }

  async function handleDisconnectGmail(accountId: string) {
    if (!confirm('Disconnect this Gmail account?')) return;
    const token = await getToken();
    await fetch('/api/intel/gmail/accounts', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: accountId }),
    });
    showToast('Disconnected');
    loadGmailAccounts();
  }

  async function safeJson(res: Response): Promise<any> {
    try {
      return await res.json();
    } catch {
      return { error: `Request failed (${res.status} ${res.statusText || 'error'})` };
    }
  }

  async function handleSyncWA() {
    setSyncing(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/intel/staging/sync-whatsapp', {
        method: 'POST', headers: { authorization: `Bearer ${token}` },
      });
      const data = await safeJson(res);
      if (!res.ok || data.error) {
        showToast(`Error: ${data.error || 'Sync failed'}`);
      } else if (data.errors?.length) {
        showToast(`Synced ${data.synced} WhatsApp contacts. Some batches failed: ${data.errors.join(', ')}`);
      } else {
        showToast(`Synced ${data.synced} new WhatsApp contacts`);
      }
      await loadWA();
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Network error'}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleSyncEmail() {
    setSyncing(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/intel/staging/sync-email', {
        method: 'POST', headers: { authorization: `Bearer ${token}` },
      });
      const data = await safeJson(res);
      if (!res.ok || data.error) showToast(`Error: ${data.error || 'Sync failed'}`);
      else if (data.errors?.length) showToast(`Synced ${data.synced} emails. Issues: ${data.errors.join(', ')}`);
      else showToast(`Synced ${data.synced} new email leads`);
      await loadEmail();
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Network error'}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleSyncAirtable() {
    setSyncing(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/intel/staging/sync-airtable', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ table: airtableTable }),
      });
      const data = await safeJson(res);
      if (!res.ok || data.error) showToast(`Error: ${data.error || 'Sync failed'}`);
      else showToast(`Synced ${data.synced} new ${airtableTable} rows`);
      await loadAirtable();
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Network error'}`);
    } finally {
      setSyncing(false);
    }
  }

  function openPromote(record: StagedRecord) {
    if (record.source_type === 'email_gmail') {
      const p = record.payload;
      setForm({
        company_name: p.company ? p.company.charAt(0).toUpperCase() + p.company.slice(1) : '',
        contact_name: p.from_name || '',
        phone: '',
        phone_whatsapp: '',
        email: p.from_email || '',
        industry: '',
        city: '',
        state: '',
        notes: `Subject: ${p.subject}\n\n${p.snippet || ''}`.slice(0, 500),
        lead_temperature: 'Warm',
      });
    } else if (record.source_type === LANDING_SOURCE_TYPE) {
      const p = record.payload;
      const segment = p.audience_segment ? `Segment: ${p.audience_segment}` : '';
      const qual = p.qualification ? `Qualification: ${p.qualification}` : '';
      const exp = p.experience ? `Experience: ${p.experience}` : '';
      const msg = p.message ? `Message: ${p.message}` : '';
      setForm({
        company_name: p.company || '',
        contact_name: p.name || '',
        phone: p.phone || '',
        phone_whatsapp: '',
        email: p.email || '',
        industry: '',
        city: p.city || '',
        state: p.state || '',
        notes: [segment, qual, exp, msg].filter(Boolean).join('\n'),
        lead_temperature: 'Hot',
      });
    } else if (record.source_type?.startsWith('airtable_')) {
      const p = record.payload;
      const pick = (...keys: string[]) => {
        for (const k of keys) {
          const v = p[k];
          if (v != null && v !== '') return Array.isArray(v) ? v.join(', ') : String(v);
        }
        return '';
      };
      setForm({
        company_name: pick('Company Name', 'Company', 'Name', 'Full Name'),
        contact_name: pick('Contact Name', 'Full Name', 'Name'),
        phone: pick('Phone Number', 'Mobile Number', 'Phone', 'Contact Number'),
        phone_whatsapp: pick('WhatsApp Number', 'Phone Number', 'Mobile Number'),
        email: pick('Email', 'Email Address'),
        industry: '',
        city: pick('City'),
        state: pick('State'),
        notes: pick('Remarks', 'Notes', 'Description'),
        lead_temperature: 'Warm',
      });
    } else {
      const p = record.payload;
      setForm({
        company_name: p.name !== 'Unknown' ? p.name : '',
        contact_name: p.name || '',
        phone: p.phone || '',
        phone_whatsapp: p.phone_whatsapp || '',
        email: '',
        industry: '',
        city: '',
        state: '',
        notes: p.last_message || '',
        lead_temperature: 'Warm',
      });
    }
    setPromoteTarget(record);
  }

  async function handlePromote() {
    if (!promoteTarget || !form.company_name.trim()) return;
    setSaving(true);
    const token = await getToken();
    const res = await fetch('/api/intel/staging/promote', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ raw_record_id: promoteTarget.id, ...form }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { showToast(`Error: ${data.error}`); return; }
    setPromoteTarget(null);
    showToast('Promoted to Intel Companies ✓');
    loadAll();
  }

  async function handleReject(id: string) {
    const token = await getToken();
    await fetch(`/api/intel/staging/${id}/reject`, { method: 'PATCH', headers: { authorization: `Bearer ${token}` } });
    showToast('Rejected');
    loadAll();
  }

  async function handleReset(id: string) {
    const token = await getToken();
    await fetch(`/api/intel/staging/${id}/reset`, { method: 'PATCH', headers: { authorization: `Bearer ${token}` } });
    showToast('Reset to pending');
    loadAll();
  }

  const records =
    activeTab === 'whatsapp' ? waRecords :
    activeTab === 'email' ? emailRecords :
    activeTab === 'landing' ? landingRecords :
    activeTab === 'call_blast' ? callBlastRecords :
    activeTab === 'airtable' ? airtableRecords :
    smsRecords;
  const filtered = records.filter(r => filter === 'all' || r.review_status === filter);
  const counts = {
    total: records.length,
    pending: records.filter(r => r.review_status === 'pending').length,
    approved: records.filter(r => r.review_status === 'approved').length,
    rejected: records.filter(r => r.review_status === 'rejected').length,
  };

  return (
    <div className="min-h-screen text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-800 border border-slate-700 px-5 py-3 text-sm text-slate-100 shadow-xl">
          {toast}
        </div>
      )}

      <section className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-[11px] text-slate-400">Lead Intelligence</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-teal-400" />
              <h1 className="text-2xl font-bold tracking-tight">Lead Intelligence</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">Review inbound leads from WhatsApp, Email, Landing Pages, Call Blast, SMS, and Airtable before promoting to Intel.</p>
          </div>

          {/* Sync button — shown only for whatsapp, email, and airtable */}
          {(activeTab === 'whatsapp' || activeTab === 'email' || activeTab === 'airtable') && (
            <button
              onClick={activeTab === 'whatsapp' ? handleSyncWA : activeTab === 'email' ? handleSyncEmail : handleSyncAirtable}
              disabled={syncing || (activeTab === 'email' && gmailAccounts.length === 0)}
              className="rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition"
            >
              {syncing ? 'Syncing…' : `↻ Sync ${activeTab === 'whatsapp' ? 'WhatsApp' : activeTab === 'email' ? 'Email' : airtableTable}`}
            </button>
          )}
        </div>

        {/* Source tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveTab('whatsapp'); setFilter('all'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'whatsapp'
                ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            💬 WhatsApp
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'whatsapp' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
              {waRecords.filter(r => r.review_status === 'pending').length}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('email'); setFilter('all'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'email'
                ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            📧 Email
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'email' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
              {emailRecords.filter(r => r.review_status === 'pending').length}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('landing'); setFilter('all'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'landing'
                ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            🌐 Landing Pages
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'landing' ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-700 text-slate-400'}`}>
              {landingRecords.filter(r => r.review_status === 'pending').length}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('call_blast'); setFilter('all'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'call_blast'
                ? 'bg-orange-500/15 border border-orange-500/30 text-orange-400'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            📞 Call Blast
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'call_blast' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-400'}`}>
              {callBlastRecords.filter(r => r.review_status === 'pending').length}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('sms'); setFilter('all'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'sms'
                ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            💬 SMS
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'sms' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'}`}>
              {smsRecords.filter(r => r.review_status === 'pending').length}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('airtable'); setFilter('all'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'airtable'
                ? 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            🗂️ Airtable
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'airtable' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-400'}`}>
              {airtableRecords.filter(r => r.review_status === 'pending').length}
            </span>
          </button>
        </div>

        {/* Table selector — only for airtable tab */}
        {activeTab === 'airtable' && (
          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200">Airtable table</span>
                <select
                  value={airtableTable}
                  onChange={e => setAirtableTable(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                >
                  {AIRTABLE_TABLES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <p className="text-xs text-slate-500">Pulls rows from the "EPR Intelligence Database" Airtable base into this table, preserving the original fields.</p>
            </div>
          </div>
        )}

        {/* Gmail account connection panel — only for email tab */}
        {activeTab === 'email' && (
          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200">Connected Gmail Accounts</span>
                {gmailAccounts.length > 0 && (
                  <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">{gmailAccounts.length} connected</span>
                )}
              </div>
              <button
                onClick={handleConnectGmail}
                disabled={connectingGmail}
                className="flex items-center gap-2 rounded-lg border border-blue-600/50 bg-blue-600/20 hover:bg-blue-600/30 px-3 py-1.5 text-xs font-semibold text-blue-400 transition"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {connectingGmail ? 'Connecting…' : '+ Connect Gmail'}
              </button>
            </div>
            {gmailAccounts.length === 0 ? (
              <p className="text-xs text-slate-500">No Gmail accounts connected. Click "Connect Gmail" to get started.</p>
            ) : (
              <div className="space-y-2">
                {gmailAccounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-sm text-slate-200">{acc.email}</span>
                      {acc.last_synced_at && (
                        <span className="ml-3 text-xs text-slate-500">Last synced {timeAgo(acc.last_synced_at)}</span>
                      )}
                    </div>
                    <button onClick={() => handleDisconnectGmail(acc.id)} className="text-xs text-red-400 hover:text-red-300">Disconnect</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary pills */}
        <div className="mb-6 grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: counts.total, color: 'bg-slate-400' },
            { label: 'Pending', value: counts.pending, color: 'bg-amber-400' },
            { label: 'Approved', value: counts.approved, color: 'bg-green-400' },
            { label: 'Rejected', value: counts.rejected, color: 'bg-red-400' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <div className={`mb-2 h-0.5 w-7 rounded-full ${s.color}`} />
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="mb-5 flex gap-1 border-b border-slate-800">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition ${
                filter === tab ? 'border-b-2 border-teal-500 text-teal-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab} {tab !== 'all' && <span className="ml-1 text-xs">({counts[tab]})</span>}
            </button>
          ))}
        </div>

        {/* Records */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-800/40" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 py-16 text-center text-slate-500">
            {activeTab === 'email' && gmailAccounts.length === 0
              ? 'Connect a Gmail account above, then click Sync Email to import leads.'
              : 'No records found'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(record => (
              <RecordCard
                key={record.id}
                record={record}
                activeTab={activeTab}
                onPromote={() => openPromote(record)}
                onReject={() => handleReject(record.id)}
                onReset={() => handleReset(record.id)}
              />
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center gap-2 border-t border-slate-900 pt-6">
          <Link href="/intel" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Back to Intel
          </Link>
        </div>
      </section>

      {/* Promote Modal */}
      {promoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-bold text-slate-100 mb-1">Promote to Intel</h2>
            <p className="text-sm text-slate-400 mb-5">Creates a company record in Intel Companies.</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Company Name <span className="text-red-400">*</span></label>
                <input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  placeholder="e.g. Acme Industries" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Contact Name</label>
                <input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                    placeholder="+91..." />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Email</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                    placeholder="email@company.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Industry</label>
                  <select value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none">
                    <option value="">Select…</option>
                    <option>Manufacturing</option><option>Trading</option>
                    <option>Import-Export</option><option>Retail</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Lead Temperature</label>
                  <select value={form.lead_temperature} onChange={e => setForm(f => ({ ...f, lead_temperature: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none">
                    <option>Hot</option><option>Warm</option><option>Cold</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">City</label>
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                    placeholder="Mumbai" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">State</label>
                  <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none">
                    <option value="">Select…</option>
                    {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none resize-none" />
              </div>
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <button onClick={() => setPromoteTarget(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm text-slate-300 transition">
                Cancel
              </button>
              <button onClick={handlePromote} disabled={saving || !form.company_name.trim()}
                className="rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-60 px-5 py-2 text-sm font-semibold text-white transition">
                {saving ? 'Promoting…' : 'Promote to Intel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordCard({ record, activeTab, onPromote, onReject, onReset }: {
  record: StagedRecord;
  activeTab: SourceTab;
  onPromote: () => void;
  onReject: () => void;
  onReset: () => void;
}) {
  const p = record.payload;
  const isEmail = record.source_type === 'email_gmail';
  const isLanding = record.source_type === LANDING_SOURCE_TYPE;
  const isAirtable = record.source_type?.startsWith('airtable_');

  const statusBadge = (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
      record.review_status === 'pending'  ? 'bg-amber-900/40 text-amber-400 border border-amber-700/40' :
      record.review_status === 'approved' ? 'bg-green-900/40 text-green-400 border border-green-700/40' :
                                            'bg-red-900/40 text-red-400 border border-red-700/40'
    }`}>
      {record.review_status}
    </span>
  );

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-base font-semibold text-slate-100">
              {isAirtable
                ? (p['Company Name'] || p['Full Name'] || p['Name'] || p['Contact Name'] || record.external_record_id)
                : isLanding ? p.name : isEmail ? (p.from_name || p.from_email) : p.name}
            </span>
            <span className="text-xs">{isAirtable ? '🗂️' : isLanding ? '🌐' : isEmail ? '📧' : '💬'}</span>
            <span className="text-sm text-slate-400">
              {isAirtable
                ? (p['Phone Number'] || p['Mobile Number'] || p['Email'] || '')
                : isLanding ? p.email : isEmail ? p.from_email : p.phone}
            </span>
            {statusBadge}
          </div>

          {isAirtable ? (
            <>
              <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-2">
                {(p['City'] || p['State']) && <span>📍 {[p['City'], p['State']].filter(Boolean).join(', ')}</span>}
                {p['_airtable_table'] && <span>🗂️ {String(p['_airtable_table'])}</span>}
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                {Object.entries(p)
                  .filter(([k, v]) => !k.startsWith('_') && !['Company Name','Full Name','Name','Contact Name','Phone Number','Mobile Number','Email','City','State'].includes(k) && v != null && v !== '')
                  .slice(0, 4)
                  .map(([k, v]) => (
                    <span key={k} className="bg-slate-800 px-2 py-0.5 rounded-full">
                      {k}: {Array.isArray(v) ? v.join(', ') : String(v).slice(0, 40)}
                    </span>
                  ))}
              </div>
              <p className="text-xs text-slate-600 mt-1">{formatDate(record.observed_at)}</p>
            </>
          ) : isLanding ? (
            <>
              <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-2">
                {p.phone && <span>📞 {p.phone}</span>}
                {p.company && <span>🏢 {p.company}</span>}
                {p.city && <span>📍 {p.city}{p.state ? `, ${p.state}` : ''}</span>}
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {p.audience_segment && (
                  <span className="bg-teal-900/40 text-teal-400 border border-teal-700/40 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {p.audience_segment.replace(/_/g, ' ')}
                  </span>
                )}
                {p.qualification && (
                  <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">
                    {p.qualification}
                  </span>
                )}
                {p.experience && (
                  <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">
                    {p.experience} exp
                  </span>
                )}
              </div>
              {p.message && <p className="text-sm text-slate-400 italic line-clamp-2">"{p.message}"</p>}
              <p className="text-xs text-slate-600 mt-1">{formatDate(record.observed_at)}</p>
            </>
          ) : isEmail ? (
            <>
              <p className="text-sm font-medium text-slate-300 mb-1">📨 {p.subject}</p>
              {p.company && <p className="text-xs text-teal-400 mb-1">🏢 {p.company}</p>}
              {p.snippet && <p className="text-sm text-slate-400 italic line-clamp-2">"{p.snippet}"</p>}
              <p className="text-xs text-slate-600 mt-1">via {p.gmail_account} · {p.date ? new Date(p.date).toLocaleDateString('en-IN') : ''}</p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-2">
                <span>{p.message_count} messages</span>
                <span>First contact: {p.first_contact_at ? new Date(p.first_contact_at).toLocaleDateString('en-IN') : '—'}</span>
              </div>
              {p.last_message && <p className="text-sm text-slate-300 italic">"{p.last_message}"</p>}
            </>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {record.review_status === 'pending' && (
            <>
              <button onClick={onPromote}
                className="rounded-lg bg-teal-600 hover:bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition">
                Promote to Intel
              </button>
              <button onClick={onReject}
                className="rounded-lg border border-red-700/50 bg-red-900/40 hover:bg-red-900/60 px-4 py-2 text-sm text-red-300 transition">
                Reject
              </button>
            </>
          )}
          {record.review_status === 'approved' && (
            <Link href={`/intel/companies/${record.promoted_company_id}`}
              className="rounded-lg border border-green-700/40 bg-green-900/30 px-4 py-2 text-sm text-green-400 hover:bg-green-900/50 transition">
              View Company →
            </Link>
          )}
          {record.review_status === 'rejected' && (
            <button onClick={onReset}
              className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm text-slate-300 transition">
              Undo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


export default function StagingPage() {
  return (
    <Suspense>
      <StagingPageInner />
    </Suspense>
  );
}
