/**
 * lib/manager/syncContactToIntel.ts
 *
 * Syncs a client_contacts row → intel_company_associated_people.
 *
 * Matching strategy to find the intel_company for a client:
 *   1. profiles.gstin  →  intel_companies.gstin          (most reliable)
 *   2. profiles.company_name ≈ intel_companies.canonical_name  (ilike fallback)
 *
 * On create  → INSERT into intel_company_associated_people, store ID back.
 * On update  → UPDATE the existing intel row (identified by intel_person_id).
 * On delete  → DELETE the intel row.
 *
 * If no matching intel_company is found the function returns synced:false
 * and no error is thrown — the contact is still saved locally.
 */

export interface SyncContactResult {
  intel_person_id: string | null;
  synced: boolean;
  reason?: string;
}

interface ContactPayload {
  id: string;
  person_name: string;
  designation: string | null;
  department: string | null;
  seniority_level: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  notes: string | null;
  intel_person_id: string | null;
  /** When false, the intel row is removed instead of synced. */
  is_active?: boolean;
}

async function findIntelCompanyId(db: any, clientId: string): Promise<string | null> {
  // Fetch client row — includes direct intel_company_id FK (migration 102) + profile_id
  const { data: client } = await db
    .from('clients')
    .select('intel_company_id, profile_id')
    .eq('id', clientId)
    .single();

  if (!client) return null;

  // Priority 1: Direct FK set by admin (most reliable — no fuzzy matching needed)
  if (client.intel_company_id) return client.intel_company_id;

  // Priority 2: Fallback — match via profiles.gstin → intel_companies.gstin
  if (!client.profile_id) return null;

  const { data: profile } = await db
    .from('profiles')
    .select('company_name, gstin')
    .eq('id', client.profile_id)
    .single();

  if (!profile) return null;

  if (profile.gstin?.trim()) {
    const { data } = await db
      .from('intel_companies')
      .select('id')
      .eq('gstin', profile.gstin.trim().toUpperCase())
      .maybeSingle();
    if (data?.id) return data.id;
  }

  // Priority 3: Case-insensitive company name match
  if (profile.company_name?.trim()) {
    const { data } = await db
      .from('intel_companies')
      .select('id')
      .ilike('canonical_name', profile.company_name.trim())
      .maybeSingle();
    if (data?.id) return data.id;
  }

  return null;
}

/** Called after INSERT or PATCH on client_contacts */
export async function syncContactToIntel(opts: {
  db: any;
  contact: ContactPayload;
  clientId: string;
}): Promise<SyncContactResult> {
  const { db, contact, clientId } = opts;

  try {
    // If contact is marked inactive, remove from intel panel and clear the FK
    if (contact.is_active === false) {
      if (contact.intel_person_id) {
        await deleteContactFromIntel({ db, intelPersonId: contact.intel_person_id });
        await db.from('client_contacts').update({ intel_person_id: null }).eq('id', contact.id);
      }
      return { intel_person_id: null, synced: false, reason: 'contact marked inactive — removed from intel panel' };
    }

    const intelCompanyId = await findIntelCompanyId(db, clientId);
    if (!intelCompanyId) {
      return { intel_person_id: null, synced: false, reason: 'no matching intel_company (gstin/name not found)' };
    }

    const personPayload = {
      company_id:       intelCompanyId,
      person_name:      contact.person_name,
      designation:      contact.designation   ?? null,
      department:       contact.department    ?? null,
      seniority_level:  contact.seniority_level ?? null,
      email:            contact.email         ?? null,
      phone:            contact.phone         ?? null,
      linkedin_url:     contact.linkedin_url  ?? null,
      notes:            contact.notes         ?? null,
      source_type:      'client_portal',
      source_vendor:    'internal',
      confidence_score: 0.95,
      is_placeholder:   false,
      last_verified_at: new Date().toISOString(),
      updated_at:       new Date().toISOString(),
      data_points:      { client_contact_id: contact.id },
    };

    let intelPersonId = contact.intel_person_id;

    if (intelPersonId) {
      // Update existing intel person row
      const { data, error } = await db
        .from('intel_company_associated_people')
        .update(personPayload)
        .eq('id', intelPersonId)
        .select('id')
        .maybeSingle();

      if (error || !data) {
        // Row may have been deleted manually in intel panel — re-insert
        intelPersonId = null;
      } else {
        intelPersonId = data.id;
      }
    }

    if (!intelPersonId) {
      // Insert new intel person row
      const { data, error } = await db
        .from('intel_company_associated_people')
        .insert({ ...personPayload, created_by: null })
        .select('id')
        .single();

      if (error) {
        return { intel_person_id: null, synced: false, reason: error.message };
      }
      intelPersonId = data.id;
    }

    // Write intel_person_id back to client_contacts
    await db
      .from('client_contacts')
      .update({ intel_person_id: intelPersonId })
      .eq('id', contact.id);

    return { intel_person_id: intelPersonId, synced: true };
  } catch (err: any) {
    return { intel_person_id: null, synced: false, reason: err?.message ?? 'unknown error' };
  }
}

/** Called after DELETE on client_contacts */
export async function deleteContactFromIntel(opts: {
  db: any;
  intelPersonId: string;
}): Promise<void> {
  try {
    await opts.db
      .from('intel_company_associated_people')
      .delete()
      .eq('id', opts.intelPersonId);
  } catch {
    // best-effort — don't throw if intel panel row is already gone
  }
}
