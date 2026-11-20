'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import StatusBadge from '@/components/crm/StatusBadge';
import InlineForm from '@/components/crm/InlineForm';

const STAGE_OPTIONS = ['Not Contacted', 'First Contact', 'Responded', 'Meeting', 'Proposal', 'Negotiation', 'Signed', 'Active', 'Dormant', 'Rejected'];
const TIER_OPTIONS = ['All', 'Hot', 'Warm', 'Cold'];
const BOOLEAN_OPTIONS = ['All', 'Yes', 'No'];

function tierBadgeClass(tier) {
  if (tier === 'Hot') return 'bg-rose-900/30 text-rose-300';
  if (tier === 'Warm') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-900 text-slate-200';
}

function hasEmailCircle(hasEmail) {
  return hasEmail
    ? 'inline-block h-2.5 w-2.5 rounded-full bg-emerald-500'
    : 'inline-block h-2.5 w-2.5 rounded-full border border-slate-600 bg-slate-900/60';
}

function toArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean);
}

export default function PartnerPipelineClient({ initialPartners, initialActivities, currentUserId, quickLinks }) {
  const [partners, setPartners] = useState(initialPartners || []);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [activities, setActivities] = useState(initialActivities || []);
  const [detailsForm, setDetailsForm] = useState({});
  const [savingDetails, setSavingDetails] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    tier: 'All',
    hasEmail: 'All',
    pitchStatus: 'All',
    dataSource: 'All',
    priorityMax: 10,
    minCompleteness: 0
  });

  // CHANGED: richer table/filter model for partner directory.
  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const cityMatch = !filters.city || String(partner.city || '').toLowerCase().includes(filters.city.toLowerCase());
      const tierMatch = filters.tier === 'All' || partner.outreach_tier === filters.tier;
      const emailMatch =
        filters.hasEmail === 'All' ||
        (filters.hasEmail === 'Yes' && Boolean(partner.has_email)) ||
        (filters.hasEmail === 'No' && !partner.has_email);
      const pitchMatch = filters.pitchStatus === 'All' || String(partner.epr_pitch_status || '') === filters.pitchStatus;
      const sourceMatch = filters.dataSource === 'All' || String(partner.data_source || '') === filters.dataSource;
      const priority = Number(partner.priority_score || 0);
      const score = Number(partner.data_completeness_score || 0);
      const priorityMatch = priority <= Number(filters.priorityMax);
      const scoreMatch = score >= Number(filters.minCompleteness);

      return cityMatch && tierMatch && emailMatch && pitchMatch && sourceMatch && priorityMatch && scoreMatch;
    });
  }, [partners, filters]);

  const selectedPartner = partners.find((partner) => partner.id === selectedPartnerId) || null;

  useEffect(() => {
    if (!selectedPartner) return;
    setDetailsForm({
      company_name: selectedPartner.company_name || '',
      partner_type: selectedPartner.partner_type || '',
      state: selectedPartner.state || '',
      city: selectedPartner.city || '',
      pincode: selectedPartner.pincode || '',
      outreach_tier: selectedPartner.outreach_tier || 'Warm',
      stage: selectedPartner.stage || 'Not Contacted',
      epr_pitch_status: selectedPartner.epr_pitch_status || 'Not Pitched',
      epr_awareness_level: selectedPartner.epr_awareness_level || 'None',
      outreach_attempt_count: Number(selectedPartner.outreach_attempt_count || 0),
      contact_person: selectedPartner.contact_person || '',
      contact_person_2: selectedPartner.contact_person_2 || '',
      contact_person_3: selectedPartner.contact_person_3 || '',
      email_primary: selectedPartner.email_primary || selectedPartner.email || '',
      email_secondary: selectedPartner.email_secondary || '',
      email_2: selectedPartner.email_2 || '',
      email_3: selectedPartner.email_3 || '',
      phone_primary: selectedPartner.phone_primary || selectedPartner.phone || '',
      phone_secondary: selectedPartner.phone_secondary || '',
      phone_tertiary: selectedPartner.phone_tertiary || '',
      phone_raw: selectedPartner.phone_raw || '',
      website: selectedPartner.website || '',
      address: selectedPartner.address || '',
      full_address: selectedPartner.full_address || '',
      data_source: selectedPartner.data_source || 'Manual',
      data_completeness_score: Number(selectedPartner.data_completeness_score || 0),
      priority_score: Number(selectedPartner.priority_score || 0),
      notes: selectedPartner.notes || ''
    });
  }, [selectedPartnerId]);

  const pitchStatuses = useMemo(() => {
    const values = Array.from(new Set(partners.map((partner) => partner.epr_pitch_status).filter(Boolean)));
    return ['All', ...values];
  }, [partners]);

  const dataSources = useMemo(() => {
    const values = Array.from(new Set(partners.map((partner) => partner.data_source).filter(Boolean)));
    return ['All', ...values];
  }, [partners]);

  async function updateStage(partnerId, stage) {
    setPartners((prev) => prev.map((partner) => (partner.id === partnerId ? { ...partner, stage } : partner)));
    const { error } = await supabase.from('partners').update({ stage }).eq('id', partnerId);
    if (error) throw error;
  }

  async function updateChecklist(partnerId, patch) {
    setPartners((prev) => prev.map((partner) => (partner.id === partnerId ? { ...partner, ...patch } : partner)));
    const { error } = await supabase.from('partners').update(patch).eq('id', partnerId);
    if (error) throw error;
  }

  async function logActivity(values) {
    if (!selectedPartnerId) return;

    const payload = {
      entity_type: 'partner',
      entity_id: selectedPartnerId,
      type: values.type,
      note: values.note || null,
      outcome: values.outcome || null,
      done_by: currentUserId
    };

    const { data, error } = await supabase.from('activities').insert(payload).select('*').single();
    if (error) throw error;

    setActivities((prev) => [data, ...prev]);
  }

  async function logOutreach(values) {
    if (!selectedPartner) return;

    const payload = {
      last_outreach_date: values.last_outreach_date || null,
      outreach_channel_preference: values.channel || null,
      outreach_response: values.response || null,
      best_time_to_call: values.best_time_to_call || null,
      outreach_attempt_count: Number(selectedPartner.outreach_attempt_count || 0) + 1
    };

    const { error } = await supabase.from('partners').update(payload).eq('id', selectedPartner.id);
    if (error) throw error;

    setPartners((prev) =>
      prev.map((partner) => (partner.id === selectedPartner.id ? { ...partner, ...payload } : partner))
    );

    await logActivity({
      type: values.channel === 'WhatsApp' ? 'WhatsApp' : values.channel === 'Email' ? 'Email' : 'Call',
      note: values.note || `Outreach via ${values.channel}`,
      outcome: values.response || null
    });
  }

  async function savePartnerDetails() {
    if (!selectedPartner) return;
    setSavingDetails(true);

    const patch = {
      company_name: detailsForm.company_name || null,
      partner_type: detailsForm.partner_type || null,
      state: detailsForm.state || null,
      city: detailsForm.city || null,
      pincode: detailsForm.pincode || null,
      outreach_tier: detailsForm.outreach_tier || null,
      stage: detailsForm.stage || null,
      epr_pitch_status: detailsForm.epr_pitch_status || null,
      epr_awareness_level: detailsForm.epr_awareness_level || null,
      outreach_attempt_count: Number(detailsForm.outreach_attempt_count || 0),
      contact_person: detailsForm.contact_person || null,
      contact_person_2: detailsForm.contact_person_2 || null,
      contact_person_3: detailsForm.contact_person_3 || null,
      email_primary: detailsForm.email_primary || null,
      email_secondary: detailsForm.email_secondary || null,
      email_2: detailsForm.email_2 || null,
      email_3: detailsForm.email_3 || null,
      email: detailsForm.email_primary || null,
      phone_primary: detailsForm.phone_primary || null,
      phone_secondary: detailsForm.phone_secondary || null,
      phone_tertiary: detailsForm.phone_tertiary || null,
      phone_raw: detailsForm.phone_raw || null,
      phone: detailsForm.phone_primary || null,
      website: detailsForm.website || null,
      address: detailsForm.address || null,
      full_address: detailsForm.full_address || null,
      data_source: detailsForm.data_source || 'Manual',
      data_completeness_score: Number(detailsForm.data_completeness_score || 0),
      priority_score: Number(detailsForm.priority_score || 0),
      notes: detailsForm.notes || null
    };

    const { error } = await supabase.from('partners').update(patch).eq('id', selectedPartner.id);
    if (!error) {
      setPartners((prev) => prev.map((partner) => (partner.id === selectedPartner.id ? { ...partner, ...patch } : partner)));
    }

    setSavingDetails(false);
  }

  const activityFields = [
    {
      name: 'type',
      label: 'Activity Type',
      type: 'select',
      required: true,
      options: ['Call', 'Email', 'WhatsApp', 'Meeting', 'LinkedIn', 'Contract', 'Referral']
    },
    { name: 'note', label: 'Note', type: 'textarea' },
    { name: 'outcome', label: 'Outcome' }
  ];

  const outreachFields = [
    { name: 'last_outreach_date', label: 'Date', type: 'date', required: true },
    {
      name: 'channel',
      label: 'Channel',
      type: 'select',
      required: true,
      options: ['Email', 'WhatsApp', 'Call', 'LinkedIn']
    },
    {
      name: 'response',
      label: 'Response',
      type: 'select',
      required: true,
      options: ['No Response', 'Interested', 'Not Interested', 'Callback']
    },
    { name: 'best_time_to_call', label: 'Best Time To Call' },
    { name: 'note', label: 'Note', type: 'textarea' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Partner Directory</h1>
          <p className="mt-1 text-sm text-slate-400">Enriched partner profiles with outreach and EPR opportunity tracking.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickLinks?.importUrl ? (
            <Link href={quickLinks.importUrl} className="rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-950">
              Import Leads
            </Link>
          ) : null}
          {quickLinks?.outreachUrl ? (
            <Link href={quickLinks.outreachUrl} className="btn-primary">
              Outreach Sequencer
            </Link>
          ) : null}
        </div>
      </div>

      {/* CHANGED: filter bar enrichment */}
      <section className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-2 xl:grid-cols-7">
        <label className="text-xs font-semibold text-slate-200">
          City
          <input
            value={filters.city}
            onChange={(event) => setFilters((prev) => ({ ...prev, city: event.target.value }))}
            className="mt-1 w-full rounded-md border border-slate-700 px-2 py-1.5 text-sm"
            placeholder="Search city"
          />
        </label>

        <label className="text-xs font-semibold text-slate-200">
          Outreach Tier
          <select
            value={filters.tier}
            onChange={(event) => setFilters((prev) => ({ ...prev, tier: event.target.value }))}
            className="mt-1 w-full rounded-md border border-slate-700 px-2 py-1.5 text-sm"
          >
            {TIER_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold text-slate-200">
          Has Email
          <select
            value={filters.hasEmail}
            onChange={(event) => setFilters((prev) => ({ ...prev, hasEmail: event.target.value }))}
            className="mt-1 w-full rounded-md border border-slate-700 px-2 py-1.5 text-sm"
          >
            {BOOLEAN_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold text-slate-200">
          EPR Pitch Status
          <select
            value={filters.pitchStatus}
            onChange={(event) => setFilters((prev) => ({ ...prev, pitchStatus: event.target.value }))}
            className="mt-1 w-full rounded-md border border-slate-700 px-2 py-1.5 text-sm"
          >
            {pitchStatuses.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold text-slate-200">
          Data Source
          <select
            value={filters.dataSource}
            onChange={(event) => setFilters((prev) => ({ ...prev, dataSource: event.target.value }))}
            className="mt-1 w-full rounded-md border border-slate-700 px-2 py-1.5 text-sm"
          >
            {dataSources.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold text-slate-200">
          Priority Score (1-10)
          <input
            type="range"
            min={1}
            max={10}
            value={filters.priorityMax}
            onChange={(event) => setFilters((prev) => ({ ...prev, priorityMax: Number(event.target.value) }))}
            className="mt-1 w-full"
          />
          <span className="text-xs text-slate-500">Up to {filters.priorityMax}</span>
        </label>

        <label className="text-xs font-semibold text-slate-200">
          Min Completeness %
          <input
            type="range"
            min={0}
            max={100}
            value={filters.minCompleteness}
            onChange={(event) => setFilters((prev) => ({ ...prev, minCompleteness: Number(event.target.value) }))}
            className="mt-1 w-full"
          />
          <span className="text-xs text-slate-500">{filters.minCompleteness}%+</span>
        </label>
      </section>

      {/* CHANGED: table view enrichment */}
      <section className="overflow-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-left text-slate-400">
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Tier</th>
              <th className="px-3 py-2">Has Email</th>
              <th className="px-3 py-2">Pitch Status</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Score%</th>
              <th className="px-3 py-2">Stage</th>
            </tr>
          </thead>
          <tbody>
            {filteredPartners.map((partner) => (
              <tr
                key={partner.id}
                className={`cursor-pointer border-b border-slate-800/60 ${selectedPartnerId === partner.id ? 'bg-blue-950/30' : ''}`}
                onClick={() => setSelectedPartnerId(partner.id)}
              >
                <td className="px-3 py-2">
                  <p className="font-semibold text-slate-100">{partner.company_name}</p>
                  <p className="text-xs text-slate-500">{partner.partner_type}</p>
                </td>
                <td className="px-3 py-2 text-slate-200">{partner.city || '-'}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tierBadgeClass(partner.outreach_tier)}`}>
                    {partner.outreach_tier || 'Cold'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={hasEmailCircle(Boolean(partner.has_email))} />
                </td>
                <td className="px-3 py-2 text-slate-200">{partner.epr_pitch_status || '-'}</td>
                <td className="px-3 py-2 text-slate-200">{partner.priority_score ?? '-'}</td>
                <td className="px-3 py-2 text-slate-200">{partner.data_completeness_score ?? 0}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge type="partner" status={partner.stage} />
                    <select
                      value={partner.stage}
                      onChange={(event) => {
                        event.stopPropagation();
                        updateStage(partner.id, event.target.value);
                      }}
                      className="rounded-md border border-slate-700 px-2 py-1 text-xs"
                    >
                      {STAGE_OPTIONS.map((stage) => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selectedPartner ? (
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">{selectedPartner.company_name}</h2>
            <p className="text-xs text-slate-500">Onboarding checklist</p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-100">Partner Details (Editable)</h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
              {[['company_name', 'Company Name'], ['partner_type', 'Partner Type'], ['state', 'State'], ['city', 'City'], ['pincode', 'Pincode'], ['contact_person', 'Contact Person'], ['contact_person_2', 'Contact Person 2'], ['contact_person_3', 'Contact Person 3'], ['email_primary', 'Email Primary'], ['email_secondary', 'Email Secondary'], ['email_2', 'Email 2'], ['email_3', 'Email 3'], ['phone_primary', 'Phone Primary'], ['phone_secondary', 'Phone Secondary'], ['phone_tertiary', 'Phone Tertiary'], ['phone_raw', 'Phone Raw'], ['website', 'Website'], ['address', 'Address'], ['full_address', 'Full Address'], ['data_source', 'Data Source'], ['outreach_attempt_count', 'Outreach Attempts'], ['data_completeness_score', 'Completeness Score'], ['priority_score', 'Priority Score'], ['notes', 'Notes']].map(([key, label]) => (
                <label key={key} className="text-xs font-semibold text-slate-200">
                  {label}
                  {key === 'notes' || key === 'full_address' || key === 'address' ? (
                    <textarea
                      value={detailsForm[key] ?? ''}
                      onChange={(event) => setDetailsForm((prev) => ({ ...prev, [key]: event.target.value }))}
                      className="mt-1 min-h-20 w-full rounded-md border border-slate-700 px-2 py-1.5 text-sm font-normal"
                    />
                  ) : (
                    <input
                      value={detailsForm[key] ?? ''}
                      onChange={(event) => setDetailsForm((prev) => ({ ...prev, [key]: event.target.value }))}
                      className="mt-1 w-full rounded-md border border-slate-700 px-2 py-1.5 text-sm font-normal"
                    />
                  )}
                </label>
              ))}

              <label className="text-xs font-semibold text-slate-200">
                Outreach Tier
                <select value={detailsForm.outreach_tier || 'Warm'} onChange={(event) => setDetailsForm((prev) => ({ ...prev, outreach_tier: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-700 px-2 py-1.5 text-sm font-normal">
                  {['Hot', 'Warm', 'Cold'].map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label className="text-xs font-semibold text-slate-200">
                Stage
                <select value={detailsForm.stage || 'Not Contacted'} onChange={(event) => setDetailsForm((prev) => ({ ...prev, stage: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-700 px-2 py-1.5 text-sm font-normal">
                  {STAGE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label className="text-xs font-semibold text-slate-200">
                EPR Pitch Status
                <select value={detailsForm.epr_pitch_status || 'Not Pitched'} onChange={(event) => setDetailsForm((prev) => ({ ...prev, epr_pitch_status: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-700 px-2 py-1.5 text-sm font-normal">
                  {['Not Pitched', 'Pitched', 'Follow Up', 'Interested', 'Declined'].map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label className="text-xs font-semibold text-slate-200">
                EPR Awareness Level
                <select value={detailsForm.epr_awareness_level || 'None'} onChange={(event) => setDetailsForm((prev) => ({ ...prev, epr_awareness_level: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-700 px-2 py-1.5 text-sm font-normal">
                  {['None', 'Low', 'High'].map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-3">
              <button type="button" onClick={savePartnerDetails} disabled={savingDetails} className="btn-primary">
                {savingDetails ? 'Saving...' : 'Save Partner Details'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['agreement_signed', 'Agreement Signed'],
              ['kit_sent', 'Kit Sent'],
              ['training_completed', 'Training Completed'],
              ['portal_access', 'Portal Access']
            ].map(([field, label]) => (
              <label key={field} className="inline-flex items-center gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-100">
                <input
                  type="checkbox"
                  checked={Boolean(selectedPartner[field])}
                  onChange={(event) =>
                    updateChecklist(selectedPartner.id, {
                      [field]: event.target.checked
                    })
                  }
                />
                {label}
              </label>
            ))}
          </div>

          {/* CHANGED: all contacts section */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-100">All Contacts</h3>
            <div className="space-y-2">
              {[
                [selectedPartner.contact_person, selectedPartner.email, selectedPartner.phone_primary],
                [selectedPartner.contact_person_2, selectedPartner.email_2, selectedPartner.phone_secondary],
                [selectedPartner.contact_person_3, selectedPartner.email_3, selectedPartner.phone_tertiary]
              ]
                .filter((row) => row.some(Boolean))
                .map((row, idx) => (
                  <div key={idx} className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200">
                    <p className="font-medium text-slate-100">{row[0] || '-'}</p>
                    <p>{row[1] || '-'}</p>
                    <p>{row[2] || '-'}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* CHANGED: outreach history with mini form */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-100">Outreach History</h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <p className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200">
                Attempts: {selectedPartner.outreach_attempt_count || 0}
              </p>
              <p className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200">
                Last Outreach: {selectedPartner.last_outreach_date || '-'}
              </p>
              <p className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200">
                Response: {selectedPartner.outreach_response || '-'}
              </p>
              <p className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200">
                Best Time To Call: {selectedPartner.best_time_to_call || '-'}
              </p>
            </div>

            <div className="mt-3">
              <InlineForm fields={outreachFields} onSave={logOutreach} submitLabel="Log Outreach" />
            </div>
          </div>

          {/* CHANGED: EPR opportunity section */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-100">EPR Opportunity</h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <p className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200">
                Awareness Level: {selectedPartner.epr_awareness_level || 'None'}
              </p>
              <p className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200">
                Pitch Status: {selectedPartner.epr_pitch_status || 'Not Pitched'}
              </p>
              <p className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200">
                Potential Referrals: {selectedPartner.potential_client_referrals || 0}
              </p>
              <p className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200">
                Priority Score: {selectedPartner.priority_score || 0}
              </p>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {toArray(selectedPartner.key_ports).map((port) => (
                <span key={port} className="rounded-full bg-blue-900/30 px-2 py-1 text-xs font-semibold text-blue-300">{port}</span>
              ))}
              {toArray(selectedPartner.cargo_types).map((cargo) => (
                <span key={cargo} className="rounded-full bg-violet-900/30 px-2 py-1 text-xs font-semibold text-violet-300">{cargo}</span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-100">Log Activity</h3>
            <InlineForm fields={activityFields} onSave={logActivity} submitLabel="Save Activity" />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-100">Recent Activities</h3>
            <ul className="space-y-2 text-sm text-slate-200">
              {activities
                .filter((item) => item.entity_type === 'partner' && item.entity_id === selectedPartner.id)
                .slice(0, 5)
                .map((item) => (
                  <li key={item.id} className="rounded-md border border-slate-800 px-3 py-2">
                    {item.type} · {item.note || 'No note'}
                  </li>
                ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
