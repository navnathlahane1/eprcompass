import Link from 'next/link';

type FieldDef = {
  name: string;
  shownAs: string;
  meaning: string;
  whyItMatters: string;
};

type FieldGroup = {
  id: string;
  title: string;
  description: string;
  fields: FieldDef[];
};

const FIELD_GROUPS: FieldGroup[] = [
  {
    id: 'company-core',
    title: 'Company Core',
    description: 'Identity and base profile fields shown on Intel company list/detail screens.',
    fields: [
      { name: 'canonical_name', shownAs: 'Company Name', meaning: 'Normalized legal/business name used as master identity.', whyItMatters: 'Prevents duplicate entities and keeps search consistent.' },
      { name: 'company_type', shownAs: 'Company Type', meaning: 'Entity category such as producer, recycler, or related class.', whyItMatters: 'Helps route outreach and compliance workflows by business type.' },
      { name: 'state', shownAs: 'State', meaning: 'Primary state associated with the company.', whyItMatters: 'Used for regional compliance mapping and filters.' },
      { name: 'city / district', shownAs: 'City / District', meaning: 'Primary city/district for location context.', whyItMatters: 'Improves geographic targeting, sorting, and coverage analysis.' },
      { name: 'website / linkedin_url', shownAs: 'Website / LinkedIn', meaning: 'Official web and profile links.', whyItMatters: 'Used for enrichment, credibility checks, and outreach prep.' },
      { name: 'cin / gstin / pan', shownAs: 'CIN / GSTIN / PAN', meaning: 'Registered corporate/tax identifiers.', whyItMatters: 'Critical for legal identity validation and dedupe confidence.' },
      { name: 'updated_at', shownAs: 'Last Updated', meaning: 'Last record update timestamp.', whyItMatters: 'Shows recency and reliability of data.' },
    ],
  },
  {
    id: 'registration-compliance',
    title: 'Registration & Compliance',
    description: 'Regulatory registration and notice-related fields shown in company and cockpit views.',
    fields: [
      { name: 'registration_count', shownAs: 'Registrations', meaning: 'Count of linked registration records for the company.', whyItMatters: 'Indicates compliance depth and record completeness.' },
      { name: 'registration_authorities', shownAs: 'Authorities', meaning: 'Regulators issuing registrations (CPCB/SPCB/etc.).', whyItMatters: 'Shows governing body and compliance jurisdiction.' },
      { name: 'registration_statuses', shownAs: 'Registration Status', meaning: 'Current state of linked registrations (active, expired, etc.).', whyItMatters: 'Highlights renewal risk and urgency.' },
      { name: 'registration_waste_categories', shownAs: 'Waste Categories', meaning: 'Registered waste categories under compliance scope.', whyItMatters: 'Determines applicable obligations and market segment fit.' },
      { name: 'notice_type / authority / deadline_date', shownAs: 'Notice Type / Authority / Deadline', meaning: 'Regulatory notice metadata and due date.', whyItMatters: 'Drives legal risk prioritization in cockpit views.' },
      { name: 'penalty_inr', shownAs: 'Penalty (INR)', meaning: 'Monetary penalty amount linked to notices or risk models.', whyItMatters: 'Quantifies urgency and commercial impact.' },
      { name: 'shortfall_mt', shownAs: 'Shortfall (MT)', meaning: 'Reported compliance shortfall in metric tons.', whyItMatters: 'Measures remediation scale and opportunity size.' },
    ],
  },
  {
    id: 'recycler-battery-intelligence',
    title: 'Recycler & Battery Intelligence',
    description: 'Operational capability fields used in recycler profiling and supply assessments.',
    fields: [
      { name: 'recycler_category', shownAs: 'Recycler Category', meaning: 'Recycler type/classification from profile datasets.', whyItMatters: 'Supports matching for partnerships and fulfillment.' },
      { name: 'battery_categories', shownAs: 'Battery Categories', meaning: 'Battery classes handled by the recycler.', whyItMatters: 'Used to match chemistry/category-specific demand.' },
      { name: 'material_categories', shownAs: 'Material Categories', meaning: 'Material streams processed by recycler.', whyItMatters: 'Improves technical fit assessment for deals.' },
      { name: 'annual_processing_capacity_mt', shownAs: 'Annual Capacity (MT)', meaning: 'Declared annual processing capacity.', whyItMatters: 'Signals throughput potential and supply-side strength.' },
      { name: 'battery_compliance_status / cpcb_registration_status', shownAs: 'Battery / CPCB Status', meaning: 'Compliance state from recycler intelligence sources.', whyItMatters: 'Separates active-compliant recyclers from high-risk options.' },
      { name: 'scale_indicator / total_credits_mt', shownAs: 'Scale / Credits', meaning: 'Derived scale and available processing/credit indicators.', whyItMatters: 'Improves prioritization for large-value opportunities.' },
    ],
  },
  {
    id: 'google-verification-geo-quality',
    title: 'Google Verification & Geo Quality',
    description: 'Location validation and matching fields from Google enrichment.',
    fields: [
      { name: 'google_place_id', shownAs: 'Google Place ID', meaning: 'Unique Google business place identifier.', whyItMatters: 'Anchors one-to-one business match and dedupe trust.' },
      { name: 'google_verified_status', shownAs: 'Google Verified Status', meaning: 'Match state such as verified, needs_review, or not_matched.', whyItMatters: 'Shows confidence in external business validation.' },
      { name: 'google_match_confidence / google_match_type', shownAs: 'Match Confidence / Type', meaning: 'Score and method of matched Google record.', whyItMatters: 'Explains reliability of automated place linkage.' },
      { name: 'active_status / business_status', shownAs: 'Operational Status', meaning: 'Whether business appears operational from source signals.', whyItMatters: 'Prevents outreach to inactive entities.' },
      { name: 'rating / review_count', shownAs: 'Rating / Reviews', meaning: 'Public Google rating metrics.', whyItMatters: 'Adds lightweight quality and legitimacy signals.' },
      { name: 'latitude / longitude / geo_accuracy_level', shownAs: 'Coordinates / Geo Accuracy', meaning: 'Geocoded position and confidence class.', whyItMatters: 'Powers proximity filters and regional analysis.' },
      { name: 'duplicate_indicator / duplicate_cluster_count', shownAs: 'Duplicate Flags', meaning: 'Signals from duplicate detection pipeline.', whyItMatters: 'Protects reporting quality and avoids repeated outreach.' },
    ],
  },
  {
    id: 'scoring-segmentation-strategy',
    title: 'Scoring, Segmentation & Strategy',
    description: 'Derived intelligence fields used by Intel list ranking and cockpit decisions.',
    fields: [
      { name: 'segment_tag', shownAs: 'Segment Tag', meaning: 'Business segment classification label.', whyItMatters: 'Controls messaging, filtering, and playbook selection.' },
      { name: 'relevance_score / lead_score', shownAs: 'Relevance / Lead Score', meaning: 'Model-driven priority scores for targeting.', whyItMatters: 'Helps teams focus on highest expected return accounts.' },
      { name: 'urgency_tier', shownAs: 'Urgency Tier', meaning: 'Hot/warm/cold urgency categorization in pipeline records.', whyItMatters: 'Drives sales sequencing and daily task focus.' },
      { name: 'enrichment_status / enrichment_confidence', shownAs: 'Enrichment Status / Confidence', meaning: 'Whether enrichment is complete and confidence in outputs.', whyItMatters: 'Prevents action on weak or incomplete records.' },
      { name: 'verification_status', shownAs: 'Verification Status', meaning: 'Entity-level verification marker in Intel list views.', whyItMatters: 'Improves trust in list exports and downstream use.' },
      { name: 'projected_inr / estimated_deal_size_inr', shownAs: 'Projected Value', meaning: 'Estimated financial value used in cockpit and pipeline views.', whyItMatters: 'Quantifies business opportunity and prioritization.' },
    ],
  },
  {
    id: 'contacts-sendpilot-leadrocks',
    title: 'Contacts, Sendpilot & LeadRocks',
    description: 'People/contact and email quality fields used for outreach workflows.',
    fields: [
      { name: 'person_name / designation', shownAs: 'Contact Name / Designation', meaning: 'Decision-maker profile details associated with a company.', whyItMatters: 'Supports role-based personalization for outreach.' },
      { name: 'email / phone / linkedin_url', shownAs: 'Contact Channels', meaning: 'Primary communication channels for associated people.', whyItMatters: 'Defines reachable channels and sequence options.' },
      { name: 'source / source_type / source_vendor', shownAs: 'Contact Source', meaning: 'Origin of the contact record (sendpilot/manual/import).', whyItMatters: 'Improves traceability and trust decisions.' },
      { name: 'sendpilot_job_id / sendpilot_lead_id', shownAs: 'Sendpilot IDs', meaning: 'Trace IDs for async discovery jobs and contact records.', whyItMatters: 'Allows job tracking and dedupe-safe upserts.' },
      { name: 'verification_status (email)', shownAs: 'Email Verification Status', meaning: 'LeadRocks verification result (valid/invalid/catch_all/unknown).', whyItMatters: 'Protects deliverability and sender reputation.' },
      { name: 'safe_to_send / is_deliverable', shownAs: 'Safe to Send / Deliverable', meaning: 'Provider signal about send safety and deliverability.', whyItMatters: 'Used to gate outbound sending lists.' },
      { name: 'is_disposable / is_role_account / is_free_account', shownAs: 'Risk Flags', meaning: 'Mailbox quality and risk characteristics.', whyItMatters: 'Helps suppress low-quality targets and reduce bounce risk.' },
    ],
  },
  {
    id: 'ingestion-sources-quality',
    title: 'Ingestion, Sources & Data Quality',
    description: 'Upload and source-governance fields used in Intel ingest operations.',
    fields: [
      { name: 'source_name / source_type / vendor_name', shownAs: 'Source Registry', meaning: 'Data provider identity and source category.', whyItMatters: 'Supports provenance audits and pipeline governance.' },
      { name: 'job_status / total_rows / inserted_rows / error_rows', shownAs: 'Import Job Metrics', meaning: 'Execution status and row-level import outcomes.', whyItMatters: 'Shows ingest quality and troubleshooting clues.' },
      { name: 'mapping_template_id / field mappings', shownAs: 'Mapping Template', meaning: 'Column mapping profile used during import.', whyItMatters: 'Improves repeatability and reduces mapping errors.' },
      { name: 'fillRate / fieldCoverage', shownAs: 'Coverage Metrics', meaning: 'Completeness indicators for uploaded data.', whyItMatters: 'Flags weak files before enrichment and downstream actions.' },
      { name: 'license_flag / reliability_tier', shownAs: 'Source Governance Flags', meaning: 'Usage and quality controls attached to a source.', whyItMatters: 'Prevents misuse and improves confidence in decisions.' },
    ],
  },
];

export default function IntelFieldExplainerPage() {
  return (
    <div className="min-h-screen text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-[11px] text-slate-400">Field Explainer</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-teal-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Data Field Explainer</h1>
            </div>
            <p className="mt-1.5 max-w-3xl text-sm text-slate-400">
              This page explains the meaning and business use of key fields shown across Intel Companies, Company Detail,
              Cockpit, Upload, and Outreach workflows.
            </p>
          </div>
          <Link
            href="/intel"
            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-teal-500/50 hover:text-teal-200"
          >
            Back to Intel Home
          </Link>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-200">
          Field names in this guide are the storage/API names. UI labels may be friendlier, but they map to the same
          data points.
        </div>

        <div className="space-y-8">
          {FIELD_GROUPS.map((group) => (
            <section
              id={group.id}
              key={group.title}
              className="scroll-mt-28 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition-colors target:border-teal-400/70 target:bg-teal-500/8"
            >
              <h2 className="text-lg font-semibold text-teal-300">{group.title}</h2>
              <p className="mt-1 text-sm text-slate-300">{group.description}</p>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      <th className="px-3 py-2">Field Name</th>
                      <th className="px-3 py-2">Shown As</th>
                      <th className="px-3 py-2">Meaning</th>
                      <th className="px-3 py-2">Why It Matters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.fields.map((field) => (
                      <tr key={`${group.title}:${field.name}`} className="border-b border-slate-800/50 align-top">
                        <td className="px-3 py-2 font-mono text-xs text-teal-300">{field.name}</td>
                        <td className="px-3 py-2 text-slate-200">{field.shownAs}</td>
                        <td className="px-3 py-2 text-slate-200">{field.meaning}</td>
                        <td className="px-3 py-2 text-slate-200">{field.whyItMatters}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-slate-900 pt-6">
          <Link href="/intel" className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Back to Intel
          </Link>
        </div>
      </div>
    </div>
  );
}
