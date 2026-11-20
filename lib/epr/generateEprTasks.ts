/**
 * lib/epr/generateEprTasks.ts
 *
 * Generates client_epr_tasks instances from epr_master_tasks templates
 * for a specific Financial Year.
 *
 * FY 2026-27: April 1, 2026 → March 31, 2027
 * Annual returns due: June 30, 2027
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WasteCategory =
  | 'plastic' | 'ewaste' | 'battery' | 'tyre'
  | 'used_oil' | 'hazardous' | 'cd_waste' | 'governance';

interface MasterTask {
  id: string;
  waste_category: WasteCategory;
  title: string;
  description: string | null;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'one_time' | 'half_yearly' | 'project_based';
  due_month: number | null;  // 1-12
  due_day: number | null;
  responsible_dept: string | null;
  priority: 'critical' | 'high' | 'normal' | 'low';
  sort_order: number;
}

interface GeneratedTask {
  client_id: string;
  template_id: string;
  fy: string;
  waste_category: string;
  title: string;
  description: string | null;
  frequency: string;
  responsible_dept: string | null;
  due_date: string;   // ISO date YYYY-MM-DD
  period_label: string;
  status: 'pending';
  priority: string;
  assigned_to: string | null;
}

// ─── FY calendar helpers ──────────────────────────────────────────────────────

const FY_CONFIGS: Record<string, {
  start: { year: number; month: number }; // April = month 4
  monthly_months: Array<{ year: number; month: number }>;
  quarterly_ends: string[];   // ISO dates
  half_yearly_ends: string[]; // ISO dates
  annual_return_date: string; // ISO date
}> = {
  '2026-27': {
    start: { year: 2026, month: 4 },
    monthly_months: [
      { year: 2026, month: 4 },
      { year: 2026, month: 5 },
      { year: 2026, month: 6 },
      { year: 2026, month: 7 },
      { year: 2026, month: 8 },
      { year: 2026, month: 9 },
      { year: 2026, month: 10 },
      { year: 2026, month: 11 },
      { year: 2026, month: 12 },
      { year: 2027, month: 1 },
      { year: 2027, month: 2 },
      { year: 2027, month: 3 },
    ],
    quarterly_ends: ['2026-06-30', '2026-09-30', '2026-12-31', '2027-03-31'],
    half_yearly_ends: ['2026-09-30', '2027-03-31'],
    annual_return_date: '2027-06-30',
  },
};

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];

const QUARTER_LABELS = ['Q1 (Apr–Jun)', 'Q2 (Jul–Sep)', 'Q3 (Oct–Dec)', 'Q4 (Jan–Mar)'];

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─── Core generation logic ────────────────────────────────────────────────────

export function generateTaskInstances(
  clientId: string,
  template: MasterTask,
  fy: string,
  assignedTo: string | null = null,
): GeneratedTask[] {
  const config = FY_CONFIGS[fy];
  if (!config) throw new Error(`Unknown FY: ${fy}`);

  const { frequency, due_month, due_day } = template;

  switch (frequency) {
    case 'monthly': {
      return config.monthly_months.map(({ year, month }, idx) => {
        const day = due_day ?? lastDayOfMonth(year, month);
        const safeDay = Math.min(day, lastDayOfMonth(year, month));
        return {
          client_id: clientId,
          template_id: template.id,
          fy,
          waste_category: template.waste_category,
          title: template.title,
          description: template.description,
          frequency: 'monthly',
          responsible_dept: template.responsible_dept,
          due_date: isoDate(year, month, safeDay),
          period_label: `${MONTH_NAMES[month]} ${year}`,
          status: 'pending',
          priority: template.priority,
          assigned_to: assignedTo,
        };
      });
    }

    case 'quarterly': {
      return config.quarterly_ends.map((dateStr, idx) => ({
        client_id: clientId,
        template_id: template.id,
        fy,
        waste_category: template.waste_category,
        title: template.title,
        description: template.description,
        frequency: 'quarterly',
        responsible_dept: template.responsible_dept,
        due_date: dateStr,
        period_label: `${QUARTER_LABELS[idx]} FY ${fy}`,
        status: 'pending',
        priority: template.priority,
        assigned_to: assignedTo,
      }));
    }

    case 'half_yearly': {
      return config.half_yearly_ends.map((dateStr, idx) => ({
        client_id: clientId,
        template_id: template.id,
        fy,
        waste_category: template.waste_category,
        title: template.title,
        description: template.description,
        frequency: 'half_yearly',
        responsible_dept: template.responsible_dept,
        due_date: dateStr,
        period_label: idx === 0 ? `H1 FY ${fy}` : `H2 FY ${fy}`,
        status: 'pending',
        priority: template.priority,
        assigned_to: assignedTo,
      }));
    }

    case 'annual': {
      // Annual returns go to the post-FY date (June 30 of next year)
      const dueDate = (due_month === 6 && due_day === 30)
        ? config.annual_return_date
        : (() => {
            const fyConf = FY_CONFIGS[fy].start;
            const year = due_month! <= 3 ? fyConf.year + 1 : fyConf.year;
            const day = due_day ?? lastDayOfMonth(year, due_month!);
            return isoDate(year, due_month!, day);
          })();

      return [{
        client_id: clientId,
        template_id: template.id,
        fy,
        waste_category: template.waste_category,
        title: template.title,
        description: template.description,
        frequency: 'annual',
        responsible_dept: template.responsible_dept,
        due_date: dueDate,
        period_label: `Annual FY ${fy}`,
        status: 'pending',
        priority: template.priority,
        assigned_to: assignedTo,
      }];
    }

    case 'one_time': {
      if (!due_month) return [];
      const fyConf = FY_CONFIGS[fy].start;
      // Months 1-3 fall in the next calendar year of the FY
      const year = due_month <= 3 ? fyConf.year + 1 : fyConf.year;
      const day = due_day ?? lastDayOfMonth(year, due_month);
      const safeDay = Math.min(day, lastDayOfMonth(year, due_month));
      return [{
        client_id: clientId,
        template_id: template.id,
        fy,
        waste_category: template.waste_category,
        title: template.title,
        description: template.description,
        frequency: 'one_time',
        responsible_dept: template.responsible_dept,
        due_date: isoDate(year, due_month, safeDay),
        period_label: `${MONTH_NAMES[due_month]} ${year}`,
        status: 'pending',
        priority: template.priority,
        assigned_to: assignedTo,
      }];
    }

    case 'project_based': {
      // Project-based tasks get a placeholder due date at FY end
      return [{
        client_id: clientId,
        template_id: template.id,
        fy,
        waste_category: template.waste_category,
        title: template.title,
        description: template.description,
        frequency: 'project_based',
        responsible_dept: template.responsible_dept,
        due_date: '2027-03-31',
        period_label: 'Project-specific',
        status: 'pending',
        priority: template.priority,
        assigned_to: assignedTo,
      }];
    }

    default:
      return [];
  }
}

// ─── Main generate function (called by API) ───────────────────────────────────

export async function generateClientEprTasks(opts: {
  db: SupabaseClient;
  clientId: string;
  wasteCategories: WasteCategory[];
  fy?: string;
  assignedTo?: string | null;
  overwrite?: boolean;
}): Promise<{ created: number; error?: string }> {
  const {
    db, clientId, wasteCategories,
    fy = '2026-27',
    assignedTo = null,
    overwrite = false,
  } = opts;

  // Always include governance tasks
  const categories: WasteCategory[] = Array.from(
    new Set([...wasteCategories, 'governance' as WasteCategory])
  );

  // If overwrite, delete existing tasks for this client+FY
  if (overwrite) {
    await (db as any)
      .from('client_epr_tasks')
      .delete()
      .eq('client_id', clientId)
      .eq('fy', fy);
  }

  // Fetch templates for the requested categories
  const { data: templates, error: fetchError } = await (db as any)
    .from('epr_master_tasks')
    .select('*')
    .in('waste_category', categories)
    .eq('is_active', true)
    .order('waste_category')
    .order('sort_order');

  if (fetchError) return { created: 0, error: fetchError.message };
  if (!templates?.length) return { created: 0 };

  // Generate all task instances
  const allTasks: GeneratedTask[] = [];
  for (const tmpl of templates as MasterTask[]) {
    const instances = generateTaskInstances(clientId, tmpl, fy, assignedTo);
    allTasks.push(...instances);
  }

  if (!allTasks.length) return { created: 0 };

  // Batch insert in chunks of 100
  let created = 0;
  for (let i = 0; i < allTasks.length; i += 100) {
    const chunk = allTasks.slice(i, i + 100);
    const { error: insertError } = await (db as any)
      .from('client_epr_tasks')
      .insert(chunk);

    if (insertError) return { created, error: insertError.message };
    created += chunk.length;
  }

  return { created };
}
