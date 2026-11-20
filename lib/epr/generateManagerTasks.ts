/**
 * lib/epr/generateManagerTasks.ts
 *
 * After client EPR tasks are generated, create corresponding oversight
 * portal_tasks for the assigned compliance manager — one per waste category.
 *
 * Title format: "Oversee {Category} EPR compliance — {Company} (FY {fy})"
 * Due date: end of the FY (March 31 for Indian FY, or June 30 for annual return)
 * task_type: 'epr_oversight'
 */
import type { SupabaseClient } from '@supabase/supabase-js';

const CATEGORY_LABEL: Record<string, string> = {
  plastic:    'Plastic Waste EPR',
  ewaste:     'E-Waste EPR',
  battery:    'Battery Waste EPR',
  tyre:       'Tyre Waste EPR',
  used_oil:   'Used Oil EPR',
  hazardous:  'Hazardous Waste',
  cd_waste:   'C&D Waste',
  governance: 'Governance',
};

const PRIORITY_MAP: Record<string, string> = {
  plastic:    'high',
  ewaste:     'high',
  battery:    'normal',
  tyre:       'normal',
  used_oil:   'normal',
  hazardous:  'urgent',
  cd_waste:   'normal',
  governance: 'normal',
};

/** Returns ISO date string for end of FY (March 31) */
function fyEndDate(fy: string): string {
  // FY label format: '2026-27'
  const endYear = parseInt(fy.split('-')[1] ?? '27') + 2000;
  return `${endYear}-03-31T17:30:00+05:30`;
}

export async function generateManagerOversightTasks(opts: {
  db:         SupabaseClient | any;
  clientId:   string;
  categories: string[];
  fy:         string;
  overwrite?: boolean;
}): Promise<{ created: number; skipped: number; error?: string }> {
  const { db, clientId, categories, fy, overwrite = false } = opts;

  // Fetch client + assigned manager
  const { data: client, error: cErr } = await db
    .from('clients')
    .select('id, assigned_manager_id, profile_id')
    .eq('id', clientId)
    .single();

  if (cErr || !client) return { created: 0, skipped: 0, error: 'Client not found' };
  if (!client.assigned_manager_id) return { created: 0, skipped: 0 }; // no manager assigned

  // Fetch company name from profiles
  const { data: profile } = await db
    .from('profiles')
    .select('company_name, full_name')
    .eq('id', client.profile_id)
    .single();
  const companyName = profile?.company_name || profile?.full_name || 'Client';

  const dueAt = fyEndDate(fy);

  // If overwrite, remove existing oversight tasks for this client+FY
  if (overwrite) {
    await db
      .from('portal_tasks')
      .delete()
      .eq('client_id', clientId)
      .eq('task_type', 'epr_oversight')
      .ilike('title', `%(FY ${fy})%`);
  }

  // Non-governance categories get a task each; governance gets one combined task
  const taskCategories = categories.filter(c => c !== 'governance');
  const hasGovernance  = categories.includes('governance');

  const rows: object[] = [];

  for (const cat of taskCategories) {
    rows.push({
      title:               `Oversee ${CATEGORY_LABEL[cat] ?? cat} compliance — ${companyName} (FY ${fy})`,
      description:         `Monitor and ensure all ${CATEGORY_LABEL[cat] ?? cat} EPR compliance tasks are completed on time for FY ${fy}. Review status regularly and escalate overdue items.`,
      task_type:           'epr_oversight',
      assigned_to:         client.assigned_manager_id,
      client_id:           clientId,
      related_entity_type: 'client',
      related_entity_id:   clientId,
      due_at:              dueAt,
      tat_minutes:         525_600,        // 365 days in minutes
      priority:            PRIORITY_MAP[cat] ?? 'normal',
      status:              'pending',
      created_by:          'system',
    });
  }

  if (hasGovernance) {
    rows.push({
      title:               `Governance & Reporting oversight — ${companyName} (FY ${fy})`,
      description:         `Ensure all internal governance tasks (board reporting, compliance disclosures) are tracked and completed for FY ${fy}.`,
      task_type:           'epr_oversight',
      assigned_to:         client.assigned_manager_id,
      client_id:           clientId,
      related_entity_type: 'client',
      related_entity_id:   clientId,
      due_at:              dueAt,
      tat_minutes:         525_600,
      priority:            'normal',
      status:              'pending',
      created_by:          'system',
    });
  }

  if (!rows.length) return { created: 0, skipped: 0 };

  const { data, error } = await db.from('portal_tasks').insert(rows).select('id');
  if (error) return { created: 0, skipped: 0, error: error.message };

  return { created: data?.length ?? 0, skipped: 0 };
}
