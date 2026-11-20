/**
 * /admin/notifications
 * Production admin panel: notification management + scraper control
 */

'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import {
  RefreshCw, Play, CheckCircle2, XCircle, Clock, AlertCircle,
  FileText, Download, Eye, Trash2, Check, X, Search,
  BarChart2, Settings, ChevronDown, Filter, ExternalLink,
  Table2
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ScrapingJob {
  id:                   string;
  job_type:             string;
  status:               string;
  pages_crawled:        number;
  notifications_found:  number;
  notifications_new:    number;
  notifications_updated:number;
  files_downloaded:     number;
  errors_count:         number;
  started_at:           string | null;
  completed_at:         string | null;
  duration_secs:        number | null;
  created_at:           string;
  is_cron:              boolean;
  error_message:        string | null;
}

interface Notification {
  id:           string;
  slug:         string;
  title:        string;
  status:       string;
  epr_type:     string | null;
  document_type:string | null;
  published_date: string | null;
  created_at:   string;
  view_count:   number;
  notification_authorities: { short_name: string } | null;
}

interface ScraperStats {
  total:  number;
  active: number;
  draft:  number;
}

// ─── Helper components ────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  active:    'bg-emerald-900/30 text-emerald-300 border-emerald-800/40',
  draft:     'bg-amber-900/30 text-amber-300 border-amber-800/40',
  archived:  'bg-slate-900 text-slate-400 border-slate-800',
  rejected:  'bg-rose-900/30 text-rose-300 border-rose-800/40',
};

const JOB_STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-900/30 text-emerald-300',
  running:   'bg-blue-900/30 text-blue-300 animate-pulse',
  failed:    'bg-rose-900/30 text-rose-300',
  pending:   'bg-amber-900/30 text-amber-300',
  cancelled: 'bg-slate-900 text-slate-400',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[status] || 'bg-slate-900 text-slate-400 border-slate-800'}`}>
      {status}
    </span>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  const icons: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 className="w-3 h-3" />,
    running:   <RefreshCw className="w-3 h-3 animate-spin" />,
    failed:    <XCircle className="w-3 h-3" />,
    pending:   <Clock className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_STYLES[status] || 'bg-slate-900 text-slate-400'}`}>
      {icons[status]}
      {status}
    </span>
  );
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDuration(secs?: number | null) {
  if (!secs) return '—';
  if (secs < 60) return `${secs}s`;
  return `${Math.round(secs / 60)}m ${secs % 60}s`;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminNotificationsPage() {
  const [jobs,           setJobs]          = useState<ScrapingJob[]>([]);
  const [notifications,  setNotifications] = useState<Notification[]>([]);
  const [stats,          setStats]         = useState<ScraperStats>({ total: 0, active: 0, draft: 0 });
  const [loading,        setLoading]       = useState(true);
  const [scraping,       setScraping]      = useState(false);
  const [activeTab,      setActiveTab]     = useState<'overview' | 'notifications' | 'jobs'>('overview');
  const [statusFilter,   setStatusFilter]  = useState('');
  const [eprFilter,      setEprFilter]     = useState('');
  const [searchQ,        setSearchQ]       = useState('');
  const [page,           setPage]          = useState(1);
  const [total,          setTotal]         = useState(0);
  const [isPending,      startTransition]  = useTransition();
  const [alertMsg,       setAlertMsg]      = useState('');
  const [alertType,      setAlertType]     = useState<'success' | 'error'>('success');

  function showAlert(msg: string, type: 'success' | 'error' = 'success') {
    setAlertMsg(msg);
    setAlertType(type);
    setTimeout(() => setAlertMsg(''), 4000);
  }

  // ── Load scraper status ──────────────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    try {
      const res  = await fetch('/api/admin/scraper/status');
      const data = await res.json();
      setJobs(data.jobs || []);
      setStats(data.stats || { total: 0, active: 0, draft: 0 });
    } catch (err) {
      console.error('Failed to load scraper status', err);
    }
  }, []);

  // ── Load notifications list ──────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (statusFilter)  params.set('status', statusFilter);
      if (eprFilter)     params.set('epr_type', eprFilter);
      if (searchQ)       params.set('q', searchQ);

      const res  = await fetch(`/api/notifications?${params}`);
      const data = await res.json();
      setNotifications(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }, [page, statusFilter, eprFilter, searchQ]);

  useEffect(() => {
    Promise.all([loadStatus(), loadNotifications()]).finally(() => setLoading(false));
  }, [loadStatus, loadNotifications]);

  // Auto-refresh if a job is running
  useEffect(() => {
    const hasRunning = jobs.some((j) => j.status === 'running');
    if (!hasRunning) return;
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, [jobs, loadStatus]);

  // ── Trigger scrape ───────────────────────────────────────────────────────
  async function triggerScrape(jobType = 'incremental') {
    setScraping(true);
    try {
      const res  = await fetch('/api/admin/scraper/trigger', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ jobType, maxPages: 30 }),
      });
      const data = await res.json();
      showAlert(data.message || `Scrape started (${jobType})`);
      setTimeout(loadStatus, 1500);
    } catch (err: any) {
      showAlert(`Failed: ${err.message}`, 'error');
    } finally {
      setScraping(false);
    }
  }

  // ── Approve/reject a notification ────────────────────────────────────────
  async function updateStatus(id: string, status: string) {
    try {
      await fetch(`/api/notifications/admin/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      });
      showAlert(`Notification ${status}`);
      loadNotifications();
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function deleteNotification(id: string) {
    if (!confirm('Soft-delete this notification?')) return;
    await fetch(`/api/notifications/admin/${id}`, { method: 'DELETE' });
    showAlert('Notification deleted');
    loadNotifications();
  }

  // ── Bulk approve all drafts ───────────────────────────────────────────────
  async function bulkApproveDrafts() {
    const draftIds = notifications.filter((n) => n.status === 'draft').map((n) => n.id);
    if (draftIds.length === 0) { showAlert('No draft notifications to approve', 'error'); return; }
    if (!confirm(`Approve all ${draftIds.length} draft notifications?`)) return;

    let ok = 0;
    for (const id of draftIds) {
      try {
        await fetch(`/api/notifications/admin/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active' }),
        });
        ok++;
      } catch { /* continue */ }
    }
    showAlert(`Approved ${ok}/${draftIds.length} notifications`);
    loadStatus();
    loadNotifications();
  }

  // ── Export ────────────────────────────────────────────────────────────────
  function exportNotifications(format: 'xlsx' | 'csv') {
    const params = new URLSearchParams({ format });
    if (statusFilter) params.set('status', statusFilter);
    if (eprFilter)    params.set('epr_type', eprFilter);
    window.open(`/api/admin/notifications/export?${params}`, '_blank');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
        <span className="ml-2 text-slate-400">Loading scraper dashboard…</span>
      </div>
    );
  }

  const latestJob = jobs[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Alert */}
      {alertMsg && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          alertType === 'success'
            ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
            : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
        }`}>
          {alertType === 'success'
            ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm font-medium">{alertMsg}</span>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Notification Scraper</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage scraped EPR notifications from filemyepr.in and other portals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadStatus(); loadNotifications(); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-800 rounded-lg hover:bg-slate-950 transition-colors">
            <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <div className="relative group">
            <button
              disabled={scraping}
              onClick={() => triggerScrape('incremental')}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {scraping
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Play className="w-4 h-4" />}
              {scraping ? 'Scraping…' : 'Run Scraper'}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-1 bg-slate-900/60 border border-slate-800 rounded-xl shadow-lg z-10 w-44 hidden group-hover:block">
              {[
                { type: 'incremental', label: 'Incremental (fast)' },
                { type: 'full',        label: 'Full crawl (slow)' },
              ].map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => triggerScrape(type)}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-950 first:rounded-t-xl last:rounded-b-xl">
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Scraped',  value: stats.total,  icon: <FileText className="w-5 h-5 text-blue-400" />,  color: 'bg-blue-950/30'  },
          { label: 'Live / Active',  value: stats.active, icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, color: 'bg-emerald-950/30' },
          { label: 'Pending Review', value: stats.draft,  icon: <Clock className="w-5 h-5 text-amber-400" />,  color: 'bg-amber-950/30' },
          { label: 'Total Jobs Run', value: jobs.length,  icon: <BarChart2 className="w-5 h-5 text-violet-400" />, color: 'bg-violet-950/30' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`${color} rounded-xl p-4 flex items-center gap-3`}>
            <div className="flex-shrink-0">{icon}</div>
            <div>
              <div className="text-2xl font-bold text-slate-100">{value.toLocaleString()}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 p-1 rounded-xl w-fit">
        {(['overview', 'notifications', 'jobs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize
              ${activeTab === tab ? 'bg-slate-900/60 text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-200'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Latest job status */}
          {latestJob && (
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-100">Latest Scrape Job</h2>
                <JobStatusBadge status={latestJob.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Pages Crawled',   value: latestJob.pages_crawled },
                  { label: 'Found',           value: latestJob.notifications_found },
                  { label: 'New',             value: latestJob.notifications_new },
                  { label: 'Updated',         value: latestJob.notifications_updated },
                  { label: 'Files DL',        value: latestJob.files_downloaded },
                  { label: 'Errors',          value: latestJob.errors_count },
                  { label: 'Duration',        value: formatDuration(latestJob.duration_secs) },
                  { label: 'Type',            value: latestJob.is_cron ? '⏰ Cron' : '👤 Manual' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-lg font-semibold text-slate-100">{value}</p>
                  </div>
                ))}
              </div>

              {latestJob.error_message && (
                <div className="mt-4 p-3 bg-rose-950/30 rounded-lg text-sm text-rose-300 border border-red-100">
                  <span className="font-medium">Error: </span>{latestJob.error_message}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                <span>Started: {formatDate(latestJob.started_at)}</span>
                {latestJob.completed_at && <span>Completed: {formatDate(latestJob.completed_at)}</span>}
                <span>Job ID: {latestJob.id.slice(0, 8)}…</span>
              </div>
            </div>
          )}

          {/* Quick actions: draft notifications that need review */}
          {stats.draft > 0 && (
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-amber-200">
                    {stats.draft} notification{stats.draft !== 1 ? 's' : ''} pending review
                  </h3>
                  <p className="text-sm text-amber-400 mt-0.5">
                    Review and approve scraped notifications before they go live.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors">
                  Review Now
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search notifications…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadNotifications()}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-800 rounded-lg focus:border-blue-400 outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-slate-800 rounded-lg focus:border-blue-400 outline-none bg-slate-900/60">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={eprFilter}
              onChange={(e) => { setEprFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-slate-800 rounded-lg focus:border-blue-400 outline-none bg-slate-900/60">
              <option value="">All EPR Types</option>
              {['Plastic','E-Waste','Battery','Tyre','Used-Oil','C&D','Hazardous'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <span className="text-xs text-slate-500">{total.toLocaleString()} total</span>

            {/* Bulk + Export actions */}
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {stats.draft > 0 && (
                <button
                  onClick={bulkApproveDrafts}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve all drafts ({stats.draft})
                </button>
              )}
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-800 text-slate-400 text-xs rounded-lg hover:bg-slate-950 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Export
                  <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute right-0 top-full mt-1 bg-slate-900/60 border border-slate-800 rounded-xl shadow-lg z-10 w-36 hidden group-hover:block">
                  <button onClick={() => exportNotifications('xlsx')} className="w-full text-left px-3 py-2.5 text-xs hover:bg-slate-950 rounded-t-xl flex items-center gap-2">
                    <Table2 className="w-3.5 h-3.5 text-emerald-400" /> Excel (.xlsx)
                  </button>
                  <button onClick={() => exportNotifications('csv')} className="w-full text-left px-3 py-2.5 text-xs hover:bg-slate-950 rounded-b-xl flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-400" /> CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Authority</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">EPR Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Published</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {notifications.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-950 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <a
                            href={`/notifications/${n.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-100 hover:text-blue-400 font-medium text-sm line-clamp-2 transition-colors">
                            {n.title}
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell">
                        {n.notification_authorities?.short_name || '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {n.epr_type && (
                          <span className="text-xs bg-blue-950/30 text-blue-300 px-1.5 py-0.5 rounded">
                            {n.epr_type}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">
                        {formatDate(n.published_date)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={n.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {n.status === 'draft' && (
                            <button
                              onClick={() => updateStatus(n.id, 'active')}
                              title="Approve"
                              className="p-1.5 rounded-lg hover:bg-emerald-950/30 text-slate-500 hover:text-emerald-400 transition-colors">
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {n.status === 'draft' && (
                            <button
                              onClick={() => updateStatus(n.id, 'rejected')}
                              title="Reject"
                              className="p-1.5 rounded-lg hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          <Link
                            href={`/admin/notifications/${n.id}`}
                            title="Edit"
                            className="p-1.5 rounded-lg hover:bg-violet-950/30 text-slate-500 hover:text-violet-400 transition-colors">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <a
                            href={`/notifications/${n.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View live"
                            className="p-1.5 rounded-lg hover:bg-blue-950/30 text-slate-500 hover:text-blue-400 transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => deleteNotification(n.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {notifications.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">
                No notifications found. Run a scrape to populate data.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── JOBS TAB ── */}
      {activeTab === 'jobs' && (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800">
                  {['Job ID','Type','Status','Found','New','Updated','Files','Errors','Duration','Started','Trigger'].map((h) => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-950 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{job.id.slice(0, 8)}…</td>
                    <td className="px-3 py-2.5 text-xs text-slate-400 capitalize">{job.job_type}</td>
                    <td className="px-3 py-2.5"><JobStatusBadge status={job.status} /></td>
                    <td className="px-3 py-2.5 text-center">{job.notifications_found}</td>
                    <td className="px-3 py-2.5 text-center text-emerald-400 font-medium">{job.notifications_new}</td>
                    <td className="px-3 py-2.5 text-center">{job.notifications_updated}</td>
                    <td className="px-3 py-2.5 text-center">{job.files_downloaded}</td>
                    <td className="px-3 py-2.5 text-center text-red-500">{job.errors_count || 0}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{formatDuration(job.duration_secs)}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{formatDate(job.started_at)}</td>
                    <td className="px-3 py-2.5 text-xs">{job.is_cron ? '⏰ Cron' : '👤 Manual'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {jobs.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">
              No scraping jobs yet. Click &quot;Run Scraper&quot; to start.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
