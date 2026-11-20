/** Build the client cockpit calendar from EPR tasks, then filing statuses, then services. */

export type CalendarItem = {
  id: string;
  title: string;
  due_date: string;
  daysLeft: number;
  source: 'task' | 'filing' | 'service';
  category?: string | null;
  status?: string | null;
};

const OPEN_TASK = new Set(['pending', 'in_progress', 'overdue']);
const CLOSED_FILING = new Set(['Approved', 'Certificate Issued', 'Filed', 'Closed']);

export function daysUntil(isoDate: string, now: Date = new Date()): number {
  const due = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(due.getTime())) return Number.POSITIVE_INFINITY;
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

type TaskRow = {
  id: string;
  title?: string | null;
  waste_category?: string | null;
  due_date?: string | null;
  status?: string | null;
  period_label?: string | null;
};

type FilingRow = {
  id: string;
  category?: string | null;
  current_status?: string | null;
  sla_due_at?: string | null;
};

type ServiceRow = {
  id: string;
  service_type?: string | null;
  due_date?: string | null;
  status?: string | null;
};

export function calendarFromTasks(rows: TaskRow[], now?: Date): CalendarItem[] {
  return (rows || [])
    .filter((row) => row.due_date && OPEN_TASK.has(String(row.status || 'pending')))
    .map((row) => ({
      id: `task-${row.id}`,
      title: row.title || row.period_label || 'EPR task',
      due_date: String(row.due_date).slice(0, 10),
      daysLeft: daysUntil(String(row.due_date), now),
      source: 'task' as const,
      category: row.waste_category,
      status: row.status,
    }));
}

export function calendarFromFilings(rows: FilingRow[], now?: Date): CalendarItem[] {
  return (rows || [])
    .filter((row) => row.sla_due_at && !CLOSED_FILING.has(String(row.current_status || '')))
    .map((row) => ({
      id: `filing-${row.id}`,
      title: `${row.category || 'EPR'} filing`,
      due_date: String(row.sla_due_at).slice(0, 10),
      daysLeft: daysUntil(String(row.sla_due_at), now),
      source: 'filing' as const,
      category: row.category,
      status: row.current_status,
    }));
}

export function calendarFromServices(rows: ServiceRow[], now?: Date): CalendarItem[] {
  return (rows || [])
    .filter((row) => row.due_date)
    .map((row) => ({
      id: `service-${row.id}`,
      title: row.service_type || 'Service',
      due_date: String(row.due_date).slice(0, 10),
      daysLeft: daysUntil(String(row.due_date), now),
      source: 'service' as const,
      status: row.status,
    }));
}

/** Prefer generated EPR tasks; else filing SLAs; else legacy services rows. */
export function resolveFilingCalendar(
  tasks: TaskRow[],
  filings: FilingRow[],
  services: ServiceRow[],
  now?: Date
): CalendarItem[] {
  const fromTasks = calendarFromTasks(tasks, now);
  if (fromTasks.length) return fromTasks.sort((a, b) => a.daysLeft - b.daysLeft);
  const fromFilings = calendarFromFilings(filings, now);
  if (fromFilings.length) return fromFilings.sort((a, b) => a.daysLeft - b.daysLeft);
  return calendarFromServices(services, now).sort((a, b) => a.daysLeft - b.daysLeft);
}
