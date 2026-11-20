'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

type DiscoverySettings = {
  keywords: string[];
  thresholds: {
    auto_accept: number;
    manual_review: number;
    duplicate_risk: number;
  };
  quota: {
    max_queries_per_job: number;
    max_places_per_query: number;
    request_delay_ms: number;
  };
  frequency: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
  };
};

type DiscoveryJob = {
  id: string;
  run_mode: string;
  cadence: string | null;
  status: string;
  queue_priority: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  stats?: {
    started_queries?: number;
    processed_places?: number;
    created_companies?: number;
    updated_companies?: number;
    review_queue_items?: number;
    failed_places?: number;
  };
};

type DiscoveryResultRow = {
  id: string;
  created_at: string;
  company_name: string | null;
  city: string | null;
  state: string | null;
  match_status: string;
  confidence_score: number | null;
  recycler_type: string | null;
  review_required: boolean;
  review_reason: string | null;
};

type ReviewQueueItem = {
  id: string;
  company_id: string;
  location_id: string | null;
  review_type: string;
  review_reason: string | null;
  status: string;
  created_at: string;
};

const defaultSettings: DiscoverySettings = {
  keywords: [],
  thresholds: {
    auto_accept: 0.82,
    manual_review: 0.6,
    duplicate_risk: 0.84
  },
  quota: {
    max_queries_per_job: 800,
    max_places_per_query: 20,
    request_delay_ms: 80
  },
  frequency: {
    daily: true,
    weekly: true,
    monthly: true
  }
};

const DISCOVERY_AUTO_REFRESH_STORAGE_KEY = 'intel.discovery.autoRefreshEnabled';
const DISCOVERY_POLL_INTERVAL_STORAGE_KEY = 'intel.discovery.pollIntervalSeconds';

type RecommendedProfile = {
  id: 'daily' | 'weekly' | 'monthly';
  title: string;
  description: string;
  settings: DiscoverySettings;
  job: {
    runMode: string;
    cadence: string;
    queuePriority: string;
    targetLimit: string;
    maxQueriesPerJob: string;
    maxPlacesPerQuery: string;
    requestDelayMs: string;
    jobKeywordsText: string;
    runImmediately: boolean;
    includeNearbySearch: boolean;
  };
};

const RECOMMENDED_PROFILES: RecommendedProfile[] = [
  {
    id: 'daily',
    title: 'Daily Sweep',
    description: 'Precision-first metro refresh with lower noise and tighter query spread.',
    settings: {
      keywords: [
        'Authorized E-Waste Recycler',
        'E Waste Recycler',
        'Battery Recycler',
        'Lithium Battery Recycler',
        'Plastic Recycler',
        'Electronics Recycler',
        'Dismantler',
        'Refurbisher'
      ],
      thresholds: {
        auto_accept: 0.89,
        manual_review: 0.7,
        duplicate_risk: 0.9
      },
      quota: {
        max_queries_per_job: 700,
        max_places_per_query: 12,
        request_delay_ms: 150
      },
      frequency: {
        daily: true,
        weekly: true,
        monthly: false
      }
    },
    job: {
      runMode: 'daily',
      cadence: 'daily',
      queuePriority: '60',
      targetLimit: '80',
      maxQueriesPerJob: '500',
      maxPlacesPerQuery: '12',
      requestDelayMs: '150',
      jobKeywordsText: 'Authorized E-Waste Recycler, E Waste Recycler, Battery Recycler, Lithium Battery Recycler, Plastic Recycler, Electronics Recycler, Dismantler, Refurbisher',
      runImmediately: true,
      includeNearbySearch: true
    }
  },
  {
    id: 'weekly',
    title: 'Weekly Coverage',
    description: 'Balanced expansion mode for broader city coverage with manageable review load.',
    settings: {
      keywords: [
        'E Waste Recycler',
        'Authorized E-Waste Recycler',
        'Battery Recycler',
        'Lithium Battery Recycler',
        'Lead Acid Battery Recycler',
        'Plastic Recycler',
        'Electronics Recycler',
        'IT Asset Disposal',
        'Dismantler',
        'Refurbisher',
        'Recycling Plant'
      ],
      thresholds: {
        auto_accept: 0.86,
        manual_review: 0.64,
        duplicate_risk: 0.88
      },
      quota: {
        max_queries_per_job: 900,
        max_places_per_query: 15,
        request_delay_ms: 120
      },
      frequency: {
        daily: true,
        weekly: true,
        monthly: true
      }
    },
    job: {
      runMode: 'weekly',
      cadence: 'weekly',
      queuePriority: '80',
      targetLimit: '150',
      maxQueriesPerJob: '900',
      maxPlacesPerQuery: '15',
      requestDelayMs: '120',
      jobKeywordsText: 'E Waste Recycler, Authorized E-Waste Recycler, Battery Recycler, Lithium Battery Recycler, Lead Acid Battery Recycler, Plastic Recycler, Electronics Recycler, IT Asset Disposal, Dismantler, Refurbisher, Recycling Plant',
      runImmediately: true,
      includeNearbySearch: true
    }
  },
  {
    id: 'monthly',
    title: 'Monthly Deep Crawl',
    description: 'Broad market-mapping mode for long-tail recycler discovery and cluster expansion.',
    settings: {
      keywords: [
        'E Waste Recycler',
        'E-Waste Recycler',
        'Authorized E-Waste Recycler',
        'Electronics Recycler',
        'IT Asset Disposal',
        'Battery Recycler',
        'Lithium Battery Recycler',
        'Lead Acid Battery Recycler',
        'Plastic Recycler',
        'Authorized Plastic Recycler',
        'Scrap Dealer',
        'Metal Scrap Dealer',
        'Recycling Plant',
        'Collection Center',
        'Dismantler',
        'Refurbisher',
        'Hazardous Waste Recycler',
        'Waste Management Company',
        'Kabadi',
        'Metal Recycler'
      ],
      thresholds: {
        auto_accept: 0.82,
        manual_review: 0.58,
        duplicate_risk: 0.85
      },
      quota: {
        max_queries_per_job: 1400,
        max_places_per_query: 22,
        request_delay_ms: 100
      },
      frequency: {
        daily: true,
        weekly: true,
        monthly: true
      }
    },
    job: {
      runMode: 'monthly',
      cadence: 'monthly',
      queuePriority: '90',
      targetLimit: '240',
      maxQueriesPerJob: '1400',
      maxPlacesPerQuery: '22',
      requestDelayMs: '100',
      jobKeywordsText: 'E Waste Recycler, E-Waste Recycler, Authorized E-Waste Recycler, Electronics Recycler, IT Asset Disposal, Battery Recycler, Lithium Battery Recycler, Lead Acid Battery Recycler, Plastic Recycler, Authorized Plastic Recycler, Scrap Dealer, Metal Scrap Dealer, Recycling Plant, Collection Center, Dismantler, Refurbisher, Hazardous Waste Recycler, Waste Management Company, Kabadi, Metal Recycler',
      runImmediately: true,
      includeNearbySearch: true
    }
  }
];

function toNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatShortDay(value: string | null | undefined) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function IntelDiscoveryPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [settings, setSettings] = useState<DiscoverySettings>(defaultSettings);
  const [keywordsText, setKeywordsText] = useState('');

  const [jobs, setJobs] = useState<DiscoveryJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedJobResults, setSelectedJobResults] = useState<DiscoveryResultRow[]>([]);
  const [loadingJobDetails, setLoadingJobDetails] = useState(false);

  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [reviewStatusFilter, setReviewStatusFilter] = useState('pending');
  const [resolutionNote, setResolutionNote] = useState('');

  const [runMode, setRunMode] = useState('manual');
  const [cadence, setCadence] = useState('');
  const [queuePriority, setQueuePriority] = useState('80');
  const [targetLimit, setTargetLimit] = useState('120');
  const [maxQueriesPerJob, setMaxQueriesPerJob] = useState('');
  const [maxPlacesPerQuery, setMaxPlacesPerQuery] = useState('');
  const [requestDelayMs, setRequestDelayMs] = useState('');
  const [jobKeywordsText, setJobKeywordsText] = useState('');
  const [runImmediately, setRunImmediately] = useState(true);
  const [includeNearbySearch, setIncludeNearbySearch] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [pollIntervalSeconds, setPollIntervalSeconds] = useState<15 | 30 | 60>(15);

  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedJobId) || null, [jobs, selectedJobId]);
  const hasRunningJobs = useMemo(() => jobs.some((job) => job.status === 'running'), [jobs]);
  const recentHistory = useMemo(() => {
    const onlyCompleted = jobs
      .filter((job) => job.status === 'completed' || job.status === 'failed')
      .slice(0, 12)
      .reverse();

    const peak = onlyCompleted.reduce((acc, job) => {
      const processed = Number(job.stats?.processed_places || 0);
      return Math.max(acc, processed);
    }, 0);

    return onlyCompleted.map((job) => {
      const processed = Number(job.stats?.processed_places || 0);
      const created = Number(job.stats?.created_companies || 0);
      const updated = Number(job.stats?.updated_companies || 0);
      const failed = Number(job.stats?.failed_places || 0);
      const ratio = peak > 0 ? processed / peak : 0;
      return {
        id: job.id,
        status: job.status,
        label: formatShortDay(job.completed_at || job.started_at || job.created_at),
        processed,
        created,
        updated,
        failed,
        barHeightPx: Math.max(8, Math.round(ratio * 78))
      };
    });
  }, [jobs]);

  const getAuthHeaders = useCallback(async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return null;
    return {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    };
  }, []);

  const fetchIntelApi = useCallback(async (path: string, init?: RequestInit) => {
    const apiBaseUrl = getIntelApiBaseUrl();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    try {
      return await fetch(`${apiBaseUrl}${normalizedPath}`, init);
    } catch (primaryError) {
      if (!apiBaseUrl) throw primaryError;
      return fetch(normalizedPath, init);
    }
  }, []);

  const loadDiscoverySettings = useCallback(async () => {
    const headers = await getAuthHeaders();
    if (!headers) throw new Error('Missing session token');

    const response = await fetchIntelApi('/api/intel/discovery/settings', { headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to load discovery settings');
    }

    const incoming = payload.settings || defaultSettings;
    const nextSettings: DiscoverySettings = {
      keywords: Array.isArray(incoming.keywords) ? incoming.keywords : [],
      thresholds: {
        auto_accept: Number(incoming.thresholds?.auto_accept ?? 0.82),
        manual_review: Number(incoming.thresholds?.manual_review ?? 0.6),
        duplicate_risk: Number(incoming.thresholds?.duplicate_risk ?? 0.84)
      },
      quota: {
        max_queries_per_job: Number(incoming.quota?.max_queries_per_job ?? 800),
        max_places_per_query: Number(incoming.quota?.max_places_per_query ?? 20),
        request_delay_ms: Number(incoming.quota?.request_delay_ms ?? 80)
      },
      frequency: {
        daily: Boolean(incoming.frequency?.daily),
        weekly: Boolean(incoming.frequency?.weekly),
        monthly: Boolean(incoming.frequency?.monthly)
      }
    };

    setSettings(nextSettings);
    setKeywordsText(nextSettings.keywords.join('\n'));
  }, [fetchIntelApi, getAuthHeaders]);

  const loadJobs = useCallback(async () => {
    const headers = await getAuthHeaders();
    if (!headers) throw new Error('Missing session token');

    const response = await fetchIntelApi('/api/intel/discovery/jobs?limit=50', { headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to load discovery jobs');
    }

    const rows: DiscoveryJob[] = Array.isArray(payload.rows) ? payload.rows : [];
    setJobs(rows);

    if (!selectedJobId && rows.length > 0) {
      setSelectedJobId(rows[0].id);
    }
  }, [fetchIntelApi, getAuthHeaders, selectedJobId]);

  const loadReviewQueue = useCallback(async (status: string) => {
    const headers = await getAuthHeaders();
    if (!headers) throw new Error('Missing session token');

    const response = await fetchIntelApi(`/api/intel/discovery/review-queue?status=${encodeURIComponent(status)}&limit=200`, {
      headers
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to load review queue');
    }

    setReviewQueue(Array.isArray(payload.rows) ? payload.rows : []);
  }, [fetchIntelApi, getAuthHeaders]);

  const loadJobDetails = useCallback(async (jobId: string) => {
    if (!jobId) {
      setSelectedJobResults([]);
      return;
    }

    setLoadingJobDetails(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) throw new Error('Missing session token');

      const response = await fetchIntelApi(`/api/intel/discovery/jobs/${encodeURIComponent(jobId)}?results_limit=150`, {
        headers
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load discovery job details');
      }

      setSelectedJobResults(Array.isArray(payload.rows) ? payload.rows : []);
    } catch (detailsError) {
      setError(detailsError instanceof Error ? detailsError.message : 'Failed to load discovery job details');
    } finally {
      setLoadingJobDetails(false);
    }
  }, [fetchIntelApi, getAuthHeaders]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await Promise.all([loadDiscoverySettings(), loadJobs(), loadReviewQueue(reviewStatusFilter)]);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to load discovery workspace');
    } finally {
      setLoading(false);
    }
  }, [loadDiscoverySettings, loadJobs, loadReviewQueue, reviewStatusFilter]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (selectedJobId) {
      loadJobDetails(selectedJobId);
    }
  }, [loadJobDetails, selectedJobId]);

  useEffect(() => {
    loadReviewQueue(reviewStatusFilter).catch((queueError) => {
      setError(queueError instanceof Error ? queueError.message : 'Failed to load review queue');
    });
  }, [loadReviewQueue, reviewStatusFilter]);

  useEffect(() => {
    try {
      const storedAutoRefresh = window.localStorage.getItem(DISCOVERY_AUTO_REFRESH_STORAGE_KEY);
      if (storedAutoRefresh === 'true' || storedAutoRefresh === 'false') {
        setAutoRefreshEnabled(storedAutoRefresh === 'true');
      }

      const storedInterval = Number(window.localStorage.getItem(DISCOVERY_POLL_INTERVAL_STORAGE_KEY));
      if (storedInterval === 15 || storedInterval === 30 || storedInterval === 60) {
        setPollIntervalSeconds(storedInterval);
      }
    } catch {
      // Ignore storage failures (private mode, blocked storage, etc.).
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(DISCOVERY_AUTO_REFRESH_STORAGE_KEY, String(autoRefreshEnabled));
      window.localStorage.setItem(DISCOVERY_POLL_INTERVAL_STORAGE_KEY, String(pollIntervalSeconds));
    } catch {
      // Ignore storage failures (private mode, blocked storage, etc.).
    }
  }, [autoRefreshEnabled, pollIntervalSeconds]);

  useEffect(() => {
    if (!autoRefreshEnabled || !hasRunningJobs) return undefined;

    const timer = window.setInterval(() => {
      loadJobs().catch(() => {
        // Keep polling resilient; errors are surfaced by manual refresh/actions.
      });

      if (selectedJobId) {
        loadJobDetails(selectedJobId).catch(() => {
          // Keep polling resilient; errors are surfaced by manual refresh/actions.
        });
      }

      loadReviewQueue(reviewStatusFilter).catch(() => {
        // Keep polling resilient; errors are surfaced by manual refresh/actions.
      });
    }, pollIntervalSeconds * 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    autoRefreshEnabled,
    hasRunningJobs,
    loadJobDetails,
    loadJobs,
    loadReviewQueue,
    pollIntervalSeconds,
    reviewStatusFilter,
    selectedJobId
  ]);

  async function saveSettings() {
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const headers = await getAuthHeaders();
      if (!headers) throw new Error('Missing session token');

      const response = await fetchIntelApi('/api/intel/discovery/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          search_keywords: keywordsText
            .split('\n')
            .map((row) => row.trim())
            .filter(Boolean),
          confidence_thresholds: {
            auto_accept: toNumber(String(settings.thresholds.auto_accept), 0.82),
            manual_review: toNumber(String(settings.thresholds.manual_review), 0.6),
            duplicate_risk: toNumber(String(settings.thresholds.duplicate_risk), 0.84)
          },
          quota_controls: {
            max_queries_per_job: Math.max(1, Math.round(toNumber(String(settings.quota.max_queries_per_job), 800))),
            max_places_per_query: Math.max(1, Math.round(toNumber(String(settings.quota.max_places_per_query), 20))),
            request_delay_ms: Math.max(0, Math.round(toNumber(String(settings.quota.request_delay_ms), 80)))
          },
          discovery_frequency: {
            daily: settings.frequency.daily,
            weekly: settings.frequency.weekly,
            monthly: settings.frequency.monthly
          }
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save discovery settings');
      }

      setSuccess('Discovery settings saved.');
      await loadDiscoverySettings();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save settings');
    } finally {
      setBusy(false);
    }
  }

  async function createAndOptionallyRunJob() {
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const headers = await getAuthHeaders();
      if (!headers) throw new Error('Missing session token');

      const response = await fetchIntelApi('/api/intel/discovery/jobs', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          run_mode: runMode,
          cadence: cadence || null,
          queue_priority: Math.max(0, Math.min(1000, Math.round(toNumber(queuePriority, 80)))),
          target_limit: Math.max(1, Math.round(toNumber(targetLimit, 120))),
          max_queries_per_job: maxQueriesPerJob.trim() ? Math.max(1, Math.round(toNumber(maxQueriesPerJob, 800))) : undefined,
          max_places_per_query: maxPlacesPerQuery.trim() ? Math.max(1, Math.round(toNumber(maxPlacesPerQuery, 20))) : undefined,
          request_delay_ms: requestDelayMs.trim() ? Math.max(0, Math.round(toNumber(requestDelayMs, 80))) : undefined,
          keywords: jobKeywordsText
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean),
          include_nearby_search: includeNearbySearch,
          run_immediately: runImmediately,
          source: 'intel_discovery_ui'
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create discovery job');
      }

      const newJobId = String(payload.job_id || payload.job?.id || '');
      setSuccess(payload.started ? 'Discovery job created and processing started.' : 'Discovery job queued successfully.');
      await loadJobs();
      if (newJobId) setSelectedJobId(newJobId);
      if (newJobId && payload.started) {
        await loadJobDetails(newJobId);
      }
    } catch (jobError) {
      setError(jobError instanceof Error ? jobError.message : 'Failed to create discovery job');
    } finally {
      setBusy(false);
    }
  }

  async function createScheduledPreset(cadenceValue: 'daily' | 'weekly' | 'monthly') {
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const headers = await getAuthHeaders();
      if (!headers) throw new Error('Missing session token');

      const response = await fetchIntelApi('/api/intel/discovery/jobs', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          run_mode: cadenceValue,
          cadence: cadenceValue,
          queue_priority: cadenceValue === 'daily' ? 60 : cadenceValue === 'weekly' ? 80 : 90,
          target_limit: cadenceValue === 'daily' ? 80 : cadenceValue === 'weekly' ? 140 : 220,
          include_nearby_search: true,
          run_immediately: false,
          source: 'intel_discovery_scheduler_preset'
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || `Failed to queue ${cadenceValue} preset`);
      }

      setSuccess(`${cadenceValue} scheduler preset queued successfully.`);
      await loadJobs();
    } catch (presetError) {
      setError(presetError instanceof Error ? presetError.message : 'Failed to queue scheduler preset');
    } finally {
      setBusy(false);
    }
  }

  async function processExistingJob(jobId: string) {
    if (!jobId) return;

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const headers = await getAuthHeaders();
      if (!headers) throw new Error('Missing session token');

      const response = await fetchIntelApi(`/api/intel/discovery/jobs/${encodeURIComponent(jobId)}/process`, {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to process discovery job');
      }

      setSuccess('Discovery job processing completed.');
      await Promise.all([loadJobs(), loadJobDetails(jobId), loadReviewQueue(reviewStatusFilter)]);
    } catch (processError) {
      setError(processError instanceof Error ? processError.message : 'Failed to process discovery job');
    } finally {
      setBusy(false);
    }
  }

  async function updateReviewItem(reviewId: string, status: 'resolved' | 'dismissed' | 'in_review') {
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const headers = await getAuthHeaders();
      if (!headers) throw new Error('Missing session token');

      const response = await fetchIntelApi(`/api/intel/discovery/review-queue/${encodeURIComponent(reviewId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status,
          resolution_note: resolutionNote.trim() || null
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update review item');
      }

      setSuccess(`Review item marked as ${status}.`);
      await loadReviewQueue(reviewStatusFilter);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to update review item');
    } finally {
      setBusy(false);
    }
  }

  function applyRecommendedProfile(profile: RecommendedProfile) {
    setSettings(profile.settings);
    setKeywordsText(profile.settings.keywords.join('\n'));
    setRunMode(profile.job.runMode);
    setCadence(profile.job.cadence);
    setQueuePriority(profile.job.queuePriority);
    setTargetLimit(profile.job.targetLimit);
    setMaxQueriesPerJob(profile.job.maxQueriesPerJob);
    setMaxPlacesPerQuery(profile.job.maxPlacesPerQuery);
    setRequestDelayMs(profile.job.requestDelayMs);
    setJobKeywordsText(profile.job.jobKeywordsText);
    setRunImmediately(profile.job.runImmediately);
    setIncludeNearbySearch(profile.job.includeNearbySearch);
    setSuccess(`${profile.title} profile applied to settings and job form.`);
    setError('');
  }

  return (
    <div className="min-h-screen text-slate-100" dir="auto">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-[11px] text-slate-400">Discovery</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-cyan-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Recycler Discovery Operations</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              Operate automated Google Maps recycler discovery with quota controls, run jobs, and clear manual review queue from one workspace.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/intel/companies"
              className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-teal-400 hover:text-teal-300"
            >
              Companies
            </Link>
            <button
              type="button"
              onClick={refreshAll}
              disabled={loading || busy}
              className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold transition hover:border-teal-400 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8">

          {error ? <p className="mb-4 rounded-md border border-rose-700 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{error}</p> : null}
          {success ? <p className="mb-4 rounded-md border border-emerald-700 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">{success}</p> : null}

          <details className="mb-6 rounded-xl border border-slate-800 bg-slate-950/70 p-4 group">
            <summary className="cursor-pointer list-none text-sm font-semibold text-teal-300 outline-none">
              <div className="flex items-center justify-between gap-3">
                <span>Operator SOP</span>
                <span className="text-[11px] font-medium text-slate-500 group-open:text-slate-400">Open for workflow and noisy-run recovery</span>
              </div>
            </summary>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Daily Workflow</h2>
                <ol className="mt-3 space-y-2 text-xs text-slate-400">
                  <li>1. Check last completed run and current pending review queue.</li>
                  <li>2. Run Daily Sweep for metro refresh.</li>
                  <li>3. Watch processed places, created companies, updated companies, and failed places.</li>
                  <li>4. Inspect Job Detail after completion and resolve high-priority review items.</li>
                </ol>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">What To Watch</h2>
                <ul className="mt-3 space-y-2 text-xs text-slate-400">
                  <li>Processed places should remain healthy without a large failed spike.</li>
                  <li>Updated companies should grow steadily; created companies should not jump unrealistically.</li>
                  <li>Review queue should stay manageable, especially duplicate-risk and CPCB-linked items.</li>
                  <li>Run history should not show sudden drops in discovery volume across consecutive runs.</li>
                </ul>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">When Runs Go Noisy</h2>
                <ul className="mt-3 space-y-2 text-xs text-slate-400">
                  <li>Raise Auto Accept and Manual Review thresholds if junk companies appear.</li>
                  <li>Lower Max Places per Query and remove broad keywords like Scrap Dealer or Kabadi.</li>
                  <li>Increase Request Delay or reduce Target Limit if failed places spike.</li>
                  <li>Switch back to Daily Sweep values for one week if duplicate-risk reviews surge.</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-amber-900/70 bg-amber-950/20 p-3 text-xs text-amber-100/85">
              Use Daily Sweep as the default operating mode, Weekly Coverage for controlled expansion, and Monthly Deep Crawl only when review capacity is available.
            </div>
          </details>

          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-teal-300">Apply Recommended Profile</h2>
                <p className="mt-1 text-xs text-slate-400">Fill both the settings panel and job form with one click.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {RECOMMENDED_PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => applyRecommendedProfile(profile)}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-left transition hover:border-teal-500 hover:bg-slate-900"
                >
                  <p className="text-sm font-semibold text-slate-100">{profile.title}</p>
                  <p className="mt-2 text-xs text-slate-400">{profile.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                    <span className="rounded-full border border-slate-700 px-2 py-1">Target {profile.job.targetLimit}</span>
                    <span className="rounded-full border border-slate-700 px-2 py-1">Queries {profile.job.maxQueriesPerJob}</span>
                    <span className="rounded-full border border-slate-700 px-2 py-1">Delay {profile.job.requestDelayMs}ms</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <h2 className="text-sm font-semibold text-teal-300">Discovery Settings</h2>
              <p className="mt-1 text-xs text-slate-400">Keywords, confidence routing, and quota controls used by auto-discovery jobs.</p>

              <label className="mt-4 block text-xs text-slate-400">Search Keywords (one per line)</label>
              <textarea
                aria-label="Search keywords"
                value={keywordsText}
                onChange={(event) => setKeywordsText(event.target.value)}
                rows={8}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-teal-400"
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Auto Accept</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={settings.thresholds.auto_accept}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        thresholds: { ...prev.thresholds, auto_accept: toNumber(event.target.value, prev.thresholds.auto_accept) }
                      }))
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Manual Review</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={settings.thresholds.manual_review}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        thresholds: { ...prev.thresholds, manual_review: toNumber(event.target.value, prev.thresholds.manual_review) }
                      }))
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Duplicate Risk</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={settings.thresholds.duplicate_risk}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        thresholds: { ...prev.thresholds, duplicate_risk: toNumber(event.target.value, prev.thresholds.duplicate_risk) }
                      }))
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Max Queries / Job</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.quota.max_queries_per_job}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        quota: { ...prev.quota, max_queries_per_job: Math.max(1, Math.round(toNumber(event.target.value, prev.quota.max_queries_per_job))) }
                      }))
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Max Places / Query</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.quota.max_places_per_query}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        quota: { ...prev.quota, max_places_per_query: Math.max(1, Math.round(toNumber(event.target.value, prev.quota.max_places_per_query))) }
                      }))
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Request Delay (ms)</label>
                  <input
                    type="number"
                    min="0"
                    value={settings.quota.request_delay_ms}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        quota: { ...prev.quota, request_delay_ms: Math.max(0, Math.round(toNumber(event.target.value, prev.quota.request_delay_ms))) }
                      }))
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={settings.frequency.daily}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        frequency: { ...prev.frequency, daily: event.target.checked }
                      }))
                    }
                  />
                  Daily
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={settings.frequency.weekly}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        frequency: { ...prev.frequency, weekly: event.target.checked }
                      }))
                    }
                  />
                  Weekly
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={settings.frequency.monthly}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        frequency: { ...prev.frequency, monthly: event.target.checked }
                      }))
                    }
                  />
                  Monthly
                </label>
              </div>

              <button
                type="button"
                onClick={saveSettings}
                disabled={loading || busy}
                className="mt-4 rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold transition hover:border-teal-400 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save Discovery Settings
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <h2 className="text-sm font-semibold text-teal-300">Create Discovery Job</h2>
              <p className="mt-1 text-xs text-slate-400">Queue or execute discovery run with optional keyword and quota overrides.</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Run Mode</label>
                  <select
                    value={runMode}
                    onChange={(event) => setRunMode(event.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  >
                    <option value="manual">manual</option>
                    <option value="adhoc">adhoc</option>
                    <option value="daily">daily</option>
                    <option value="weekly">weekly</option>
                    <option value="monthly">monthly</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Cadence (optional)</label>
                  <select
                    value={cadence}
                    onChange={(event) => setCadence(event.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  >
                    <option value="">none</option>
                    <option value="daily">daily</option>
                    <option value="weekly">weekly</option>
                    <option value="monthly">monthly</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Queue Priority (0-1000)</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={queuePriority}
                    onChange={(event) => setQueuePriority(event.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Target Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={targetLimit}
                    onChange={(event) => setTargetLimit(event.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Max Queries / Job (optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={maxQueriesPerJob}
                    onChange={(event) => setMaxQueriesPerJob(event.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Max Places / Query (optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={maxPlacesPerQuery}
                    onChange={(event) => setMaxPlacesPerQuery(event.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-1 block text-xs text-slate-400">Request Delay (ms, optional)</label>
                <input
                  type="number"
                  min="0"
                  value={requestDelayMs}
                  onChange={(event) => setRequestDelayMs(event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                />
              </div>

              <div className="mt-3">
                <label className="mb-1 block text-xs text-slate-400">Job Keywords Override (comma separated)</label>
                <input
                  value={jobKeywordsText}
                  onChange={(event) => setJobKeywordsText(event.target.value)}
                  placeholder="E Waste Recycler, Plastic Recycler"
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                  <input type="checkbox" checked={runImmediately} onChange={(event) => setRunImmediately(event.target.checked)} />
                  Run immediately
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                  <input type="checkbox" checked={includeNearbySearch} onChange={(event) => setIncludeNearbySearch(event.target.checked)} />
                  Include nearby search
                </label>
              </div>

              <button
                type="button"
                onClick={createAndOptionallyRunJob}
                disabled={loading || busy}
                className="mt-4 rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold transition hover:border-teal-400 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Create Discovery Job
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-teal-300">Discovery Jobs</h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {jobs.length} jobs
                    {hasRunningJobs && autoRefreshEnabled ? ` • live updates every ${pollIntervalSeconds}s` : ''}
                    {hasRunningJobs && !autoRefreshEnabled ? ' • auto-refresh paused' : ''}
                  </span>
                  <label className="inline-flex items-center gap-2 text-[11px] text-slate-400">
                    <input
                      type="checkbox"
                      checked={autoRefreshEnabled}
                      onChange={(event) => setAutoRefreshEnabled(event.target.checked)}
                    />
                    Auto-refresh
                  </label>
                  <select
                    aria-label="Auto refresh interval"
                    value={pollIntervalSeconds}
                    disabled={!autoRefreshEnabled}
                    onChange={(event) => setPollIntervalSeconds(Number(event.target.value) as 15 | 30 | 60)}
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] outline-none focus:border-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value={15}>15s</option>
                    <option value={30}>30s</option>
                    <option value={60}>60s</option>
                  </select>
                </div>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      <th className="px-2 py-2">Job</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Mode</th>
                      <th className="px-2 py-2">Queries</th>
                      <th className="px-2 py-2">Places</th>
                      <th className="px-2 py-2">Created</th>
                      <th className="px-2 py-2">Updated</th>
                      <th className="px-2 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-2 py-3 text-slate-500">
                          {loading ? 'Loading jobs...' : 'No discovery jobs yet.'}
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job) => (
                        <tr
                          key={job.id}
                          className={`border-b border-slate-900 ${selectedJobId === job.id ? 'bg-slate-900/60' : ''}`}
                        >
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => setSelectedJobId(job.id)}
                              className="text-left text-teal-300 hover:text-teal-200"
                              aria-label={`Open job ${job.id}`}
                            >
                              {job.id.slice(0, 8)}
                            </button>
                          </td>
                          <td className="px-2 py-2 text-slate-300">{job.status}</td>
                          <td className="px-2 py-2 text-slate-300">{job.run_mode}</td>
                          <td className="px-2 py-2 text-slate-300">{Number(job.stats?.started_queries || 0)}</td>
                          <td className="px-2 py-2 text-slate-300">{Number(job.stats?.processed_places || 0)}</td>
                          <td className="px-2 py-2 text-slate-400">{formatDateTime(job.created_at)}</td>
                          <td className="px-2 py-2 text-slate-400">{formatDateTime(job.completed_at || job.started_at)}</td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => processExistingJob(job.id)}
                              disabled={busy || job.status === 'running'}
                              className="rounded border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-200 hover:border-teal-400 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Process
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <h2 className="text-sm font-semibold text-teal-300">Job Detail</h2>
              {selectedJob ? (
                <div className="mt-2 text-xs text-slate-300">
                  <p>Status: {selectedJob.status}</p>
                  <p>Started: {formatDateTime(selectedJob.started_at)}</p>
                  <p>Completed: {formatDateTime(selectedJob.completed_at)}</p>
                  {selectedJob.error_message ? <p className="text-rose-300">Error: {selectedJob.error_message}</p> : null}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500">Select a job to inspect results.</p>
              )}

              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      <th className="px-2 py-2">When</th>
                      <th className="px-2 py-2">Company</th>
                      <th className="px-2 py-2">State</th>
                      <th className="px-2 py-2">City</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Confidence</th>
                      <th className="px-2 py-2">Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedJobResults.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-2 py-3 text-slate-500">
                          {loadingJobDetails ? 'Loading job results...' : 'No job results found.'}
                        </td>
                      </tr>
                    ) : (
                      selectedJobResults.map((row) => (
                        <tr key={row.id} className="border-b border-slate-900">
                          <td className="px-2 py-2 text-slate-400">{formatDateTime(row.created_at)}</td>
                          <td className="px-2 py-2 text-slate-200">{row.company_name || '-'}</td>
                          <td className="px-2 py-2 text-slate-300">{row.state || '-'}</td>
                          <td className="px-2 py-2 text-slate-300">{row.city || '-'}</td>
                          <td className="px-2 py-2 text-slate-300">{row.match_status}</td>
                          <td className="px-2 py-2 text-slate-300">{row.confidence_score == null ? '-' : row.confidence_score.toFixed(3)}</td>
                          <td className="px-2 py-2 text-slate-300">{row.review_required ? row.review_reason || 'yes' : 'no'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <h2 className="text-sm font-semibold text-teal-300">Scheduler Presets</h2>
              <p className="mt-1 text-xs text-slate-400">One-click cadence templates for recurring discovery coverage.</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => createScheduledPreset('daily')}
                  disabled={busy || loading}
                  className="rounded-lg border border-cyan-700/70 bg-cyan-950/30 px-3 py-3 text-left transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <p className="text-xs font-semibold text-cyan-200">Daily Sweep</p>
                  <p className="mt-1 text-[11px] text-slate-400">High-priority metros, fast refresh.</p>
                </button>
                <button
                  type="button"
                  onClick={() => createScheduledPreset('weekly')}
                  disabled={busy || loading}
                  className="rounded-lg border border-teal-700/70 bg-teal-950/30 px-3 py-3 text-left transition hover:border-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <p className="text-xs font-semibold text-teal-200">Weekly Coverage</p>
                  <p className="mt-1 text-[11px] text-slate-400">Broader expansion and refresh mix.</p>
                </button>
                <button
                  type="button"
                  onClick={() => createScheduledPreset('monthly')}
                  disabled={busy || loading}
                  className="rounded-lg border border-amber-700/70 bg-amber-950/30 px-3 py-3 text-left transition hover:border-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <p className="text-xs font-semibold text-amber-200">Monthly Deep Crawl</p>
                  <p className="mt-1 text-[11px] text-slate-400">Max target expansion and discovery.</p>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-teal-300">Run History</h2>
                <p className="text-[11px] text-slate-500">Last {recentHistory.length} completed/failed jobs</p>
              </div>

              {recentHistory.length === 0 ? (
                <p className="mt-6 text-xs text-slate-500">No completed runs yet. Queue a preset or run a job to see history.</p>
              ) : (
                <div className="mt-4">
                  <div className="flex h-28 items-end gap-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    {recentHistory.map((entry) => (
                      <div key={entry.id} className="flex min-w-[26px] flex-1 flex-col items-center gap-1">
                        <div
                          title={`Processed ${entry.processed} | Created ${entry.created} | Updated ${entry.updated} | Failed ${entry.failed}`}
                          className={`w-full rounded-t ${entry.status === 'failed' ? 'bg-rose-500/80' : 'bg-teal-500/80'}`}
                          style={{ height: `${entry.barHeightPx}px` }}
                        />
                        <span className="text-[10px] text-slate-500">{entry.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <p>Bar height by processed places</p>
                    <p className="text-right">Teal = completed, Rose = failed</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-teal-300">Manual Review Queue</h2>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400" htmlFor="reviewStatusFilter">
                  Status
                </label>
                <select
                  id="reviewStatusFilter"
                  value={reviewStatusFilter}
                  onChange={(event) => setReviewStatusFilter(event.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs outline-none focus:border-teal-400"
                >
                  <option value="pending">pending</option>
                  <option value="in_review">in_review</option>
                  <option value="resolved">resolved</option>
                  <option value="dismissed">dismissed</option>
                  <option value="all">all</option>
                </select>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                aria-label="Resolution note"
                value={resolutionNote}
                onChange={(event) => setResolutionNote(event.target.value)}
                placeholder="Optional resolution note for queue updates"
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
              />
              <button
                type="button"
                onClick={() => loadReviewQueue(reviewStatusFilter)}
                className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-teal-400 hover:text-teal-300"
              >
                Reload Queue
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    <th className="px-2 py-2">Review</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Reason</th>
                    <th className="px-2 py-2">Company</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Created</th>
                    <th className="px-2 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewQueue.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-2 py-3 text-slate-500">
                        {loading ? 'Loading queue...' : 'No review queue items.'}
                      </td>
                    </tr>
                  ) : (
                    reviewQueue.map((row) => (
                      <tr key={row.id} className="border-b border-slate-900">
                        <td className="px-2 py-2 text-teal-300">{row.id.slice(0, 8)}</td>
                        <td className="px-2 py-2 text-slate-300">{row.review_type}</td>
                        <td className="px-2 py-2 text-slate-300">{row.review_reason || '-'}</td>
                        <td className="px-2 py-2 text-slate-300">{row.company_id.slice(0, 8)}</td>
                        <td className="px-2 py-2 text-slate-300">{row.status}</td>
                        <td className="px-2 py-2 text-slate-400">{formatDateTime(row.created_at)}</td>
                        <td className="px-2 py-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => updateReviewItem(row.id, 'in_review')}
                              disabled={busy}
                              className="rounded border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-200 hover:border-teal-400 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              In Review
                            </button>
                            <button
                              type="button"
                              onClick={() => updateReviewItem(row.id, 'resolved')}
                              disabled={busy}
                              className="rounded border border-emerald-700 px-2 py-1 text-[11px] font-semibold text-emerald-200 hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Resolve
                            </button>
                            <button
                              type="button"
                              onClick={() => updateReviewItem(row.id, 'dismissed')}
                              disabled={busy}
                              className="rounded border border-rose-700 px-2 py-1 text-[11px] font-semibold text-rose-200 hover:border-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Dismiss
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-slate-900 pt-6">
          <Link href="/intel" className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Back to Intel
          </Link>
        </div>
      </section>
    </div>
  );
}
