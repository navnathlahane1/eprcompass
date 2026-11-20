'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const COLUMNS = ['Open', 'In Progress', 'Blocked', 'Done', 'Cancelled'];
const CATEGORIES = ['Proposal', 'Filing', 'Onboarding', 'Escalation', 'General'];
const PROPOSAL_TARGET = 48;
const FILING_TARGET = 20;

const CHECKLIST_ITEMS = [
  'Maintain 48 proposals/day pipeline',
  'Ensure same-day proposal dispatch',
  'Run daily follow-up calls on open proposals',
  'Deploy all 340 resources (check if done by Day 5)',
  'Assign 20 filings/day minimum across groups',
  'Escalate non-performers within 24 hrs',
];

function priorityBorder(priority: string) {
  if (priority === 'Urgent') return 'border-l-red-500';
  if (priority === 'High') return 'border-l-orange-500';
  if (priority === 'Medium') return 'border-l-blue-500';
  return 'border-l-gray-400';
}

function priorityBadge(priority: string) {
  if (priority === 'Urgent') return 'bg-rose-900/30 text-rose-300';
  if (priority === 'High') return 'bg-orange-900/30 text-orange-300';
  if (priority === 'Medium') return 'bg-blue-900/30 text-blue-300';
  return 'bg-slate-900 text-slate-200';
}

function categoryBadge(category: string) {
  if (category === 'Proposal')   return 'bg-purple-900/40 text-purple-300 border-purple-700/40';
  if (category === 'Filing')     return 'bg-blue-900/40 text-blue-300 border-blue-700/40';
  if (category === 'Onboarding') return 'bg-green-900/40 text-green-300 border-green-700/40';
  if (category === 'Escalation') return 'bg-red-900/40 text-red-300 border-red-700/40';
  return 'bg-slate-800 text-slate-400 border-slate-700/40';
}

function getCategory(task: any): string {
  const first = task.tags?.[0] || '';
  return CATEGORIES.includes(first) ? first : 'General';
}

function daysOverdue(dueDate?: string | null) {
  if (!dueDate) return 0;
  const diff = Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000);
  return Math.max(0, diff);
}

function elapsedHours(from: string, to?: string | null) {
  const end = to ? new Date(to).getTime() : Date.now();
  return (end - new Date(from).getTime()) / 3600000;
}

function formatElapsed(hours: number) {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${h}h ${m}m`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isToday(iso: string | null) {
  if (!iso) return false;
  return iso.slice(0, 10) === todayStr();
}

export default function TaskBoardPageClient({ initialTasks, entities, assignees, currentUserId, workflowCounts }: any) {
  const [tasks, setTasks] = useState(initialTasks || []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    assigned_to: 'All',
    entity_type: 'All',
    priority: 'All',
    overdueOnly: false,
    category: 'All',
    search: '',
    slaBreachOnly: false,
  });
  const [myTasksMode, setMyTasksMode] = useState(false);
  const [commentByTask, setCommentByTask] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [entityQuery, setEntityQuery] = useState('');
  const [toast, setToast] = useState('');
  const [checklistOpen, setChecklistOpen] = useState(true);
  const [checklist, setChecklist] = useState<Record<number, boolean>>({});
  const escalationsRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    entity_type: 'general',
    entity_id: '',
    assigned_to: '',
    priority: 'Medium',
    due_date: '',
    sla_hours: '',
    tags: '',
    category: 'General',
  });

  // Load checklist from localStorage
  useEffect(() => {
    const key = `checklist-${todayStr()}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) setChecklist(JSON.parse(saved));
    } catch {}
  }, []);

  function toggleChecklist(idx: number) {
    setChecklist(prev => {
      const next = { ...prev, [idx]: !prev[idx] };
      try { localStorage.setItem(`checklist-${todayStr()}`, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  const entityOptions = useMemo(() => {
    const list = (entities || []).filter((e: any) => e.type === form.entity_type);
    if (!entityQuery.trim()) return list.slice(0, 30);
    const q = entityQuery.toLowerCase();
    return list.filter((e: any) => String(e.name || '').toLowerCase().includes(q)).slice(0, 30);
  }, [entities, form.entity_type, entityQuery]);

  // Stats
  const stats = useMemo(() => {
    const now = Date.now();
    let open = 0, inProgress = 0, blocked = 0, overdue = 0;
    let proposalsToday = 0, filingsToday = 0;
    let slaBreach = 0;

    (tasks || []).forEach((t: any) => {
      if (t.status === 'Open') open++;
      if (t.status === 'In Progress') inProgress++;
      if (t.status === 'Blocked') blocked++;
      if (t.due_date && new Date(t.due_date).getTime() < now && !['Done','Cancelled'].includes(t.status)) overdue++;

      const cat = getCategory(t);
      if (isToday(t.completed_at)) {
        if (cat === 'Proposal') proposalsToday++;
        if (cat === 'Filing') filingsToday++;
      }

      if (t.sla_hours && !['Done','Cancelled'].includes(t.status)) {
        const elapsed = elapsedHours(t.created_at, null);
        if (elapsed > t.sla_hours) slaBreach++;
      }
    });

    return { open, inProgress, blocked, overdue, proposalsToday, filingsToday, slaBreach };
  }, [tasks]);

  // Assignee workload
  const assigneeWorkload = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {};
    (tasks || []).forEach((t: any) => {
      if (!t.assigned_to || ['Done','Cancelled'].includes(t.status)) return;
      if (!map[t.assigned_to]) map[t.assigned_to] = { name: t.assigned_name || t.assigned_to, count: 0 };
      map[t.assigned_to].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [tasks]);

  const maxWorkload = useMemo(() => Math.max(...assigneeWorkload.map(a => a.count), 1), [assigneeWorkload]);

  // Filtered tasks
  const filtered = useMemo(() => {
    return (tasks || []).filter((t: any) => {
      if (myTasksMode && t.assigned_to !== currentUserId) return false;
      if (filters.assigned_to !== 'All') {
        if (filters.assigned_to === 'unassigned') {
          if (t.assigned_to !== null && t.assigned_to !== undefined) return false;
        } else if (t.assigned_to !== filters.assigned_to) return false;
      }
      if (filters.entity_type !== 'All' && t.entity_type !== filters.entity_type) return false;
      if (filters.priority !== 'All' && t.priority !== filters.priority) return false;
      if (filters.overdueOnly && daysOverdue(t.due_date) === 0) return false;
      if (filters.category !== 'All' && getCategory(t) !== filters.category) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!String(t.title || '').toLowerCase().includes(q) && !String(t.description || '').toLowerCase().includes(q)) return false;
      }
      if (filters.slaBreachOnly) {
        if (!t.sla_hours || ['Done','Cancelled'].includes(t.status)) return false;
        if (elapsedHours(t.created_at, null) <= t.sla_hours) return false;
      }
      return true;
    });
  }, [tasks, filters, myTasksMode, currentUserId]);

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = { Open: [], 'In Progress': [], Blocked: [], Done: [], Cancelled: [] };
    filtered.forEach((t: any) => {
      if (map[t.status]) map[t.status].push(t);
    });
    return map;
  }, [filtered]);

  const escalated = useMemo(() => {
    return filtered.filter((t: any) =>
      (t.tags || []).includes('escalation') || (t.tags || []).includes('Escalation') || daysOverdue(t.due_date) > 1
    );
  }, [filtered]);

  // EOD Report
  function generateEOD() {
    const breachedTasks = (tasks || []).filter((t: any) => {
      if (['Done','Cancelled'].includes(t.status)) return false;
      return daysOverdue(t.due_date) > 0 || (t.sla_hours && elapsedHours(t.created_at) > t.sla_hours);
    });

    const lines = [
      `📋 EOD Task Report — ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      '',
      `✅ Completed Today: ${(tasks||[]).filter((t:any) => isToday(t.completed_at)).length} tasks`,
      `🔄 In Progress: ${stats.inProgress} tasks`,
      `⛔ Blocked: ${stats.blocked} tasks`,
      `⚠️ Overdue: ${stats.overdue} tasks`,
      '',
      '📊 Daily Targets:',
      `• Proposals: ${stats.proposalsToday}/${PROPOSAL_TARGET}`,
      `• Filings: ${stats.filingsToday}/${FILING_TARGET}`,
      '',
      '🚨 Escalated/Blocked Tasks:',
      ...breachedTasks.slice(0, 10).map((t: any) => {
        const hrs = Math.floor(elapsedHours(t.created_at));
        return `• ${t.title} — Assigned to ${t.assigned_name || 'Unassigned'} — ${hrs}h elapsed`;
      }),
      breachedTasks.length === 0 ? '  None' : '',
      '',
      'Generated from EPRCertificate Task Portal',
    ];

    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Copied!'));
  }

  async function addTask(event: React.FormEvent) {
    event.preventDefault();
    if (!currentUserId) return;
    setSaving(true);
    try {
      const categoryTag = form.category || 'General';
      const extraTags = form.tags ? form.tags.split(',').map((x) => x.trim()).filter(Boolean) : [];
      const tags = [categoryTag, ...extraTags.filter(t => t !== categoryTag)];

      const payload = {
        title: form.title,
        description: form.description || null,
        entity_type: form.entity_type,
        entity_id: form.entity_id || null,
        assigned_to: form.assigned_to || null,
        priority: form.priority,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        sla_hours: form.sla_hours ? Number(form.sla_hours) : null,
        tags,
      };

      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || 'Failed to create task');
        return;
      }
      const { task: data } = await res.json();

      const assignee = (assignees || []).find((a: any) => a.id === data.assigned_to);
      const entity = (entities || []).find((e: any) => e.type === data.entity_type && e.id === data.entity_id);

      setTasks((prev: any[]) => [{
        ...data,
        assigned_name: assignee?.full_name || null,
        assigned_initials: assignee?.full_name ? assignee.full_name.split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() : null,
        entity_name: entity?.name || data.entity_type,
        comments: []
      }, ...prev]);

      setForm({ title: '', description: '', entity_type: 'general', entity_id: '', assigned_to: '', priority: 'Medium', due_date: '', sla_hours: '', tags: '', category: 'General' });
      setEntityQuery('');
      showToast('Task created');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(taskId: string, status: string) {
    const patch: Record<string, unknown> = { status };
    if (status === 'Done') patch.completed_at = new Date().toISOString();
    const res = await fetch(`/api/admin/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return;
    setTasks((prev: any[]) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  }

  async function updateActualHours(taskId: string, value: string) {
    const hours = Number(value || 0);
    const res = await fetch(`/api/admin/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actual_hours: hours }),
    });
    if (!res.ok) return;
    setTasks((prev: any[]) => prev.map((t) => (t.id === taskId ? { ...t, actual_hours: hours } : t)));
  }

  async function addComment(taskId: string) {
    const content = (commentByTask[taskId] || '').trim();
    if (!content || !currentUserId) return;
    const res = await fetch(`/api/admin/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) return;
    const { comment: data } = await res.json();
    setTasks((prev: any[]) => prev.map((task) => task.id === taskId ? {
      ...task,
      comments: [...(task.comments || []), { ...data, author_name: 'You' }]
    } : task));
    setCommentByTask((prev) => ({ ...prev, [taskId]: '' }));
  }

  function TATIndicator({ task }: { task: any }) {
    const done = ['Done', 'Cancelled'].includes(task.status);
    const hours = elapsedHours(task.created_at, done ? task.completed_at : null);
    const sla = task.sla_hours;

    let color = 'text-slate-500';
    let label = '';

    if (sla) {
      if (hours > sla) {
        color = 'text-red-400 font-semibold';
        label = ' · SLA Breached';
      } else if (hours > sla * 0.75) {
        color = 'text-amber-400';
        label = ' · Near SLA';
      }
    }

    return (
      <p className={`text-[10px] mt-1 ${color}`}>
        ⏱ {formatElapsed(hours)}{label}
      </p>
    );
  }

  function TaskCard({ task }: { task: any }) {
    const overdue = daysOverdue(task.due_date);
    const category = getCategory(task);
    const isExpanded = expandedId === task.id;

    return (
      <div className={`rounded-lg border border-l-4 border-slate-800 bg-slate-950 p-3 ${priorityBorder(task.priority)}`}>
        <button onClick={() => setExpandedId(isExpanded ? null : task.id)} className="w-full text-left">
          <p className="text-sm font-semibold text-slate-100">{task.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityBadge(task.priority)}`}>{task.priority}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${categoryBadge(category)}`}>{category}</span>
            {task.assigned_initials ? (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[9px] font-semibold text-slate-200">{task.assigned_initials}</span>
            ) : null}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-500">{task.entity_name || '-'}</p>
          <p className="text-[10px] text-slate-500">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN') : '-'}</p>
          {overdue > 0 ? <p className="text-[10px] font-semibold text-rose-300">{overdue}d overdue</p> : null}
          <TATIndicator task={task} />
        </button>

        {isExpanded ? (
          <div className="mt-3 space-y-3 border-t border-slate-800 pt-3">
            <p className="text-xs text-slate-200">{task.description || 'No description'}</p>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-200">Status</label>
              <select value={task.status} onChange={(e) => updateStatus(task.id, e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100">
                {['Open', 'In Progress', 'Blocked', 'Done', 'Cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-200">Actual hours</label>
              <input type="number" defaultValue={task.actual_hours || ''} onBlur={(e) => updateActualHours(task.id, e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100" />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-200">Comments ({(task.comments || []).length})</p>
              <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border border-slate-800 bg-slate-900/60 p-2">
                {(task.comments || []).map((c: any) => (
                  <div key={c.id} className="rounded border border-slate-800/60 p-2 text-xs">
                    <p className="font-semibold text-slate-200">{c.author_name}</p>
                    <p className="mt-0.5 text-slate-300">{c.content}</p>
                  </div>
                ))}
                {(task.comments || []).length === 0 ? <p className="text-xs text-slate-500">No comments yet.</p> : null}
              </div>
              <textarea value={commentByTask[task.id] || ''} onChange={(e) => setCommentByTask((p) => ({ ...p, [task.id]: e.target.value }))} placeholder="Add comment" className="mt-2 min-h-16 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100" />
              <button onClick={() => addComment(task.id)} className="mt-2 rounded border border-blue-700/50 px-2 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-900/20">Add Comment</button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const wf = workflowCounts || {};

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-100 shadow-xl">
          {toast}
        </div>
      )}

      {/* FEATURE 10 — SLA Breach Banner */}
      {stats.slaBreach > 0 && (
        <div
          className="flex cursor-pointer items-center justify-between rounded-xl border border-amber-700/50 bg-amber-950/30 px-4 py-3"
          onClick={() => setFilters(f => ({ ...f, slaBreachOnly: !f.slaBreachOnly }))}
        >
          <span className="text-sm font-semibold text-amber-300">
            ⚠️ {stats.slaBreach} task{stats.slaBreach > 1 ? 's' : ''} {filters.slaBreachOnly ? '(showing breached only — click to clear)' : 'have breached SLA — click to filter'}
          </span>
        </div>
      )}

      {/* FEATURE 7 — Escalations Banner */}
      {escalated.length > 0 && (
        <div
          className="flex cursor-pointer items-center justify-between rounded-xl border border-red-700/50 bg-red-950/30 px-4 py-3"
          onClick={() => escalationsRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span className="text-sm font-semibold text-red-300">
            🚨 {escalated.length} task{escalated.length > 1 ? 's' : ''} need immediate attention — click to jump to Escalations
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Task Board</h1>
          <p className="mt-0.5 text-sm text-slate-400">Kanban by status with SLA, TAT, and workflow tracking.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMyTasksMode(m => !m)}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${myTasksMode ? 'border-teal-500 bg-teal-600/20 text-teal-300' : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            {myTasksMode ? '👤 My Tasks' : '📋 All Tasks'}
          </button>
          <button onClick={generateEOD} className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition">
            📊 EOD Report
          </button>
        </div>
      </div>

      {/* FEATURE 1 — Dashboard Summary */}
      <section className="space-y-3">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Open', value: stats.open, color: 'text-slate-100', bar: 'bg-slate-500' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-blue-300', bar: 'bg-blue-500' },
            { label: 'Blocked', value: stats.blocked, color: 'text-amber-300', bar: 'bg-amber-500' },
            { label: 'Overdue', value: stats.overdue, color: 'text-red-300', bar: 'bg-red-500' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className={`mb-1.5 h-0.5 w-7 rounded-full ${s.bar}`} />
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Daily targets + Assignee workload */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Daily targets */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-100">Daily Targets</p>
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-400">Proposals today</span>
                  <span className="font-semibold text-slate-200">{stats.proposalsToday} / {PROPOSAL_TARGET}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-purple-500 transition-all" style={{ width: `${Math.min(100, (stats.proposalsToday / PROPOSAL_TARGET) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-400">Filings today</span>
                  <span className="font-semibold text-slate-200">{stats.filingsToday} / {FILING_TARGET}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (stats.filingsToday / FILING_TARGET) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Assignee workload */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-100">Team Workload (open tasks)</p>
            {assigneeWorkload.length === 0 ? (
              <p className="text-xs text-slate-500">No open tasks assigned</p>
            ) : (
              <div className="space-y-2">
                {assigneeWorkload.map(a => (
                  <div key={a.name} className="flex items-center gap-2">
                    <span className="w-24 truncate text-xs text-slate-400">{a.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800">
                      <div className="h-1.5 rounded-full bg-teal-500 transition-all" style={{ width: `${(a.count / maxWorkload) * 100}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 w-5 text-right">{a.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FEATURE 5 — Workflow Funnel (Reverse Pyramid) */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="mb-4 text-sm font-semibold text-slate-100">Workflow Pipeline</p>
        <div className="flex flex-col items-center gap-1">
          {[
            { label: 'Lead In',      sub: 'Telecaller qualifies',  count: wf.leadIn      ?? 0, w: 'w-full',    bg: 'bg-slate-700/80',        text: 'text-slate-100',   border: 'border-slate-600' },
            { label: 'Proposal Out', sub: 'Ops Lead dispatches',   count: wf.proposalOut ?? 0, w: 'w-[85%]',   bg: 'bg-purple-900/60',       text: 'text-purple-200',  border: 'border-purple-700/50' },
            { label: 'Invoice',      sub: 'Conversion tracked',    count: wf.invoice     ?? 0, w: 'w-[68%]',   bg: 'bg-blue-900/60',         text: 'text-blue-200',    border: 'border-blue-700/50' },
            { label: 'Client On',    sub: 'Onboarding confirmed',  count: wf.clientOn    ?? 0, w: 'w-[50%]',   bg: 'bg-teal-900/60',         text: 'text-teal-200',    border: 'border-teal-700/50' },
            { label: 'Filing Done',  sub: 'Delivery complete',     count: wf.filingDone  ?? 0, w: 'w-[34%]',   bg: 'bg-green-900/60',        text: 'text-green-200',   border: 'border-green-700/50' },
          ].map((stage, i, arr) => {
            const top = arr[0].count;
            const pct = top > 0 ? Math.round((stage.count / top) * 100) : (i === 0 ? 100 : 0);
            return (
              <div key={stage.label} className={`${stage.w} transition-all duration-300`}>
                <div className={`flex items-center justify-between rounded-lg border ${stage.border} ${stage.bg} px-4 py-2.5`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-white">{stage.count}</span>
                    <div>
                      <p className={`text-xs font-semibold ${stage.text}`}>{stage.label}</p>
                      <p className="text-[10px] text-slate-500">{stage.sub}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{pct}%</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex justify-center my-0.5">
                    <svg className="h-3 w-3 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURE 9 — Key Actions Checklist */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60">
        <button
          onClick={() => setChecklistOpen(o => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-100"
        >
          <span>✅ Today&apos;s Key Actions</span>
          <span className="text-slate-500">{checklistOpen ? '▲' : '▼'}</span>
        </button>
        {checklistOpen && (
          <div className="border-t border-slate-800 px-4 pb-4 pt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {CHECKLIST_ITEMS.map((item, i) => (
              <label key={i} className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={!!checklist[i]}
                  onChange={() => toggleChecklist(i)}
                  className="mt-0.5 rounded border-slate-600 bg-slate-800 accent-teal-500"
                />
                <span className={`text-sm ${checklist[i] ? 'line-through text-slate-500' : 'text-slate-300'}`}>{item}</span>
              </label>
            ))}
          </div>
        )}
      </section>

      {/* Add Task Form */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Add Task</h2>
        <form onSubmit={addTask} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
          <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
            {['Low', 'Medium', 'High', 'Urgent'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select value={form.entity_type} onChange={(e) => setForm((p) => ({ ...p, entity_type: e.target.value, entity_id: '' }))} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
            {['general', 'client', 'lead', 'partner', 'recycler', 'cepc'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input value={entityQuery} onChange={(e) => setEntityQuery(e.target.value)} placeholder="Entity search" className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" disabled={form.entity_type === 'general'} />
          <select value={form.entity_id} onChange={(e) => setForm((p) => ({ ...p, entity_id: e.target.value }))} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" disabled={form.entity_type === 'general'}>
            <option value="">Select entity</option>
            {entityOptions.map((e: any) => <option key={`${e.type}-${e.id}`} value={e.id}>{e.name}</option>)}
          </select>

          <select value={form.assigned_to} onChange={(e) => setForm((p) => ({ ...p, assigned_to: e.target.value }))} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
            <option value="">Assign To</option>
            {(assignees || []).map((a: any) => <option key={a.id} value={a.id}>{a.full_name || a.id}</option>)}
          </select>
          <input type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
          <input type="number" value={form.sla_hours} onChange={(e) => setForm((p) => ({ ...p, sla_hours: e.target.value }))} placeholder="SLA hours" className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />

          <input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="Extra tags (comma-separated)" className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="min-h-20 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 md:col-span-2" />
          <button disabled={saving} className="btn-primary md:col-span-3">{saving ? 'Saving...' : 'Add Task'}</button>
        </form>
      </section>

      {/* Filters */}
      <section className="grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-4 lg:grid-cols-6">
        <input
          type="search"
          placeholder="Search tasks…"
          value={filters.search}
          onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 md:col-span-2"
        />
        <select value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
          <option value="All">Category: All</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.assigned_to} onChange={(e) => setFilters((p) => ({ ...p, assigned_to: e.target.value }))} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
          <option value="All">Assignee: All</option>
          <option value="unassigned">Unassigned</option>
          {(assignees || []).map((a: any) => <option key={a.id} value={a.id}>{a.full_name || a.id}</option>)}
        </select>
        <select value={filters.priority} onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
          {['All', 'Low', 'Medium', 'High', 'Urgent'].map((item) => <option key={item} value={item}>Priority: {item}</option>)}
        </select>
        <label className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200">
          <input type="checkbox" checked={filters.overdueOnly} onChange={(e) => setFilters((p) => ({ ...p, overdueOnly: e.target.checked }))} className="accent-teal-500" />
          Overdue only
        </label>
      </section>

      {/* Kanban Board */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {COLUMNS.map((column) => (
          <article key={column} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">{column}</h3>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">{(grouped[column] || []).length}</span>
            </div>
            <div className="space-y-3">
              {(grouped[column] || []).map((task: any) => <TaskCard key={task.id} task={task} />)}
              {(grouped[column] || []).length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-700 px-3 py-6 text-center text-xs text-slate-500">No tasks</p>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      {/* FEATURE 7 — Escalations Column */}
      <section ref={escalationsRef} className="rounded-xl border border-red-800/30 bg-red-950/20 p-4">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-red-300">🚨 Escalations</h3>
          <span className="rounded-full bg-red-900/40 px-2 py-0.5 text-[10px] text-red-300">{escalated.length}</span>
        </div>
        {escalated.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No escalated tasks — all clear ✓</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {escalated.map((task: any) => <TaskCard key={task.id} task={task} />)}
          </div>
        )}
      </section>
    </div>
  );
}
