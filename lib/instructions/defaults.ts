export type ModuleInstructionContent = {
  module_key: string;
  module_name: string;
  audience: 'admin' | 'portal';
  how_it_works: string;
  what_to_do: string;
  data_flow: string;
  dos: string;
  donts: string;
  escalation: string;
};

export const MODULE_INSTRUCTION_DEFAULTS: ModuleInstructionContent[] = [
  {
    module_key: 'admin.dashboard',
    module_name: 'Admin Dashboard',
    audience: 'admin',
    how_it_works: 'This dashboard is the operational cockpit for daily execution. It consolidates lead movement, compliance workload, pending approvals, and financial checkpoints so you can prioritize the next action without opening each module one by one.',
    what_to_do: 'Start with overdue and high-priority cards first. Check compliance and billing blockers, then assign actions to owners in team follow-ups. End by verifying no critical alerts remain unresolved.',
    data_flow: 'Data is aggregated from CRM, compliance tasks, billing events, and document states. Widgets surface summaries only, while drill-down actions route you to the source modules for record-level work.',
    dos: 'Use it for prioritization and accountability. Review at least twice daily. Use timestamps to verify freshness before making decisions.',
    donts: 'Do not treat dashboard counts as a substitute for record-level validation. Do not close issues only from summary cards without opening the source item.',
    escalation: 'If KPI numbers look inconsistent for more than one refresh cycle, escalate to platform admin with screenshot, widget name, and expected versus actual values.'
  },
  {
    module_key: 'admin.crm',
    module_name: 'CRM',
    audience: 'admin',
    how_it_works: 'CRM tracks lifecycle from inquiry to conversion and retention. Every account interaction, owner assignment, follow-up date, and stage transition should be captured here to maintain a single source of truth.',
    what_to_do: 'Create or update records immediately after each customer interaction. Maintain next action dates, expected close timeline, and confidence level. Keep notes structured so another team member can continue the thread without context loss.',
    data_flow: 'Leads enter via forms, calls, imports, or manual creation. Stage and status updates feed dashboard metrics, reminders, and downstream workflows such as compliance onboarding and billing setup.',
    dos: 'Log every customer touchpoint. Use consistent stage definitions. Set a clear next action for every open opportunity.',
    donts: 'Do not keep critical updates in private chat only. Do not leave leads in stale stages without owner or follow-up date.',
    escalation: 'Escalate duplicate records, ownership conflicts, or sync failures to CRM operations with lead IDs and affected timeline.'
  },
  {
    module_key: 'admin.compliance',
    module_name: 'Compliance',
    audience: 'admin',
    how_it_works: 'Compliance manages filings, statutory due dates, document sufficiency, and audit readiness. It converts legal obligations into trackable internal tasks with owners and deadlines.',
    what_to_do: 'Validate due dates, open pending filings, and clear blockers by requesting missing inputs from clients. Mark status only after documentary evidence is attached and reviewed.',
    data_flow: 'Compliance entries are generated from account profiles, regulatory calendars, and filing events. Status updates reflect in dashboard risk indicators and client-visible portal sections.',
    dos: 'Follow checklist-driven review. Record who reviewed and when. Attach proof for each completion.',
    donts: 'Do not mark filings complete before acknowledgment is available. Do not ignore nearing deadlines without reassignment.',
    escalation: 'Escalate legal ambiguity, deadline risk under 48 hours, or filing portal failures to compliance lead immediately.'
  },
  {
    module_key: 'admin.documents',
    module_name: 'Documents',
    audience: 'admin',
    how_it_works: 'Documents centralizes collection, verification, versioning, and approval of customer files used across onboarding, compliance, and billing operations.',
    what_to_do: 'Review incoming uploads for completeness and validity, tag correctly, and request re-upload when unreadable or expired. Approve only after matching account and document type rules.',
    data_flow: 'Users upload documents through portal or admin workflows. Metadata and status are stored per account and referenced by compliance and transaction flows.',
    dos: 'Use clear naming, verify issue and expiry dates, and keep latest approved version visible.',
    donts: 'Do not delete historical versions without retention policy approval. Do not approve cropped or partial files.',
    escalation: 'Escalate suspected forged documents, repeated upload failures, or storage access issues to security and platform support.'
  },
  {
    module_key: 'admin.recyclers',
    module_name: 'Recyclers',
    audience: 'admin',
    how_it_works: 'This module manages recycler onboarding, profile quality, compliance checks, and eligibility for marketplace or partnership workflows.',
    what_to_do: 'Verify legal entity details, licenses, and capacity indicators. Keep status aligned with the latest compliance review and engagement stage.',
    data_flow: 'Recycler records are created from onboarding inputs and enriched by compliance/document verification. Approved status feeds downstream operational and commercial modules.',
    dos: 'Validate licensing data at source. Keep contact and operating geography current.',
    donts: 'Do not activate recyclers with incomplete legal checks. Do not rely on outdated certificates.',
    escalation: 'Escalate licensing discrepancies or high-risk compliance findings to compliance head before any activation.'
  },
  {
    module_key: 'admin.billing',
    module_name: 'Billing',
    audience: 'admin',
    how_it_works: 'Billing manages invoice generation, payment tracking, reconciliation notes, and exception handling for subscriptions, services, and one-time transactions.',
    what_to_do: 'Issue invoices with correct tax profile and plan details. Track due dates, confirm receipts, and flag delayed payments for follow-up. Reconcile payment references with gateway/bank records.',
    data_flow: 'Billing receives charge context from plans and completed services. Payment events update invoice status and feed dashboard receivable metrics.',
    dos: 'Double-check tax fields and customer GST data. Maintain clear notes for adjustments and waivers.',
    donts: 'Do not backdate invoices without audit note. Do not mark paid unless transaction reference is verifiable.',
    escalation: 'Escalate mismatch between gateway and ledger, disputed invoices, or repeated failed collections to finance owner.'
  },
  {
    module_key: 'admin.marketplace',
    module_name: 'Marketplace',
    audience: 'admin',
    how_it_works: 'Marketplace coordinates listings, buyer-seller interactions, qualification checks, and transaction progression until closure.',
    what_to_do: 'Keep listings accurate, monitor inquiry quality, and ensure each transaction stage has a responsible owner. Resolve stale deals with follow-up or closure rationale.',
    data_flow: 'Listings and inquiries generate transactional records. Status and matching outcomes influence performance analytics and partner utilization reports.',
    dos: 'Enforce standardized listing metadata. Track reasons for non-conversion.',
    donts: 'Do not leave open transactions without next step and owner. Do not publish incomplete or non-compliant listings.',
    escalation: 'Escalate fraud indicators, repeated non-performance, or contract disputes to operations and legal reviewers.'
  },
  {
    module_key: 'admin.cepc',
    module_name: 'CEPC',
    audience: 'admin',
    how_it_works: 'CEPC supports certificate-oriented workflows where eligibility checks, document proof, and progress milestones must be tracked with strong auditability.',
    what_to_do: 'Validate prerequisites, progress records through checklist stages, and keep applicant communication explicit at each milestone.',
    data_flow: 'Applications flow from intake to verification, then approval or rejection with evidence. Results sync to reporting and customer communication channels.',
    dos: 'Capture reasoned decisions and attach supporting files for every status change.',
    donts: 'Do not skip mandatory validation steps. Do not approve on verbal confirmation alone.',
    escalation: 'Escalate policy interpretation conflicts or missing regulatory clarifications to program owner.'
  },
  {
    module_key: 'admin.academy',
    module_name: 'Academy',
    audience: 'admin',
    how_it_works: 'Academy handles training catalog, enrollments, attendance tracking, and completion outputs for educational and capacity-building programs.',
    what_to_do: 'Publish accurate session details, track registrations, confirm attendance completion, and issue follow-up communication for next learning steps.',
    data_flow: 'Registrations from forms and campaigns become participant records. Attendance/completion outcomes feed CRM segmentation and success reporting.',
    dos: 'Keep trainer, schedule, and prerequisites updated before publishing.',
    donts: 'Do not mark completion without attendance evidence. Do not run sessions with outdated agenda details.',
    escalation: 'Escalate platform registration failures or attendance mismatch complaints to academy operations owner.'
  },
  {
    module_key: 'admin.team-settings',
    module_name: 'Team Settings',
    audience: 'admin',
    how_it_works: 'Team Settings controls user onboarding, role assignment, and module-level access. It determines who can view or operate each admin module.',
    what_to_do: 'Create users with least-privilege module access, review assignments periodically, and update immediately when responsibilities change.',
    data_flow: 'User profile metadata and module permissions are consumed by navigation filtering and route-level authorization checks.',
    dos: 'Apply principle of least privilege. Review access after team movement or attrition.',
    donts: 'Do not grant broad access by default. Do not leave orphaned active accounts.',
    escalation: 'Escalate unauthorized access suspicion or role misconfiguration incidents to security admin.'
  },
  {
    module_key: 'admin.notifications',
    module_name: 'Notifications',
    audience: 'admin',
    how_it_works: 'Notifications configures operational and customer alerts for status updates, reminders, and important action triggers across the platform.',
    what_to_do: 'Keep notification templates accurate, verify channel mappings, and ensure critical alerts are enabled for time-sensitive workflows.',
    data_flow: 'System events from CRM, compliance, billing, and portal actions trigger templates which are routed to configured channels and recipients.',
    dos: 'Test templates after edits. Keep escalation recipients current.',
    donts: 'Do not disable critical alerts without replacement workflow. Do not send ambiguous messages lacking next action.',
    escalation: 'Escalate delivery failures, duplicate sends, or missing trigger events to platform engineering with event IDs.'
  },
  {
    module_key: 'admin.instructions',
    module_name: 'Instructions',
    audience: 'admin',
    how_it_works: 'Instructions is the knowledge control center for module guidance. Content here appears in contextual help pages inside admin and portal modules.',
    what_to_do: 'Maintain concise but complete operational guidance per module. Update content whenever workflow, policy, or ownership changes.',
    data_flow: 'Instruction records are loaded by module help pages using module keys. Edits immediately revalidate and refresh help endpoints.',
    dos: 'Use clear, action-oriented language. Include escalation path and ownership notes.',
    donts: 'Do not publish outdated process steps. Do not leave placeholders in production guidance.',
    escalation: 'Escalate missing module coverage or conflicting SOP sources to platform operations lead.'
  },
  {
    module_key: 'portal.dashboard',
    module_name: 'Portal Dashboard',
    audience: 'portal',
    how_it_works: 'Portal Dashboard gives a single view of your company profile status, open filings, recent activity, and quick actions for documents, payments, and account updates.',
    what_to_do: 'Review pending items first, open quick links to complete overdue tasks, and monitor activity updates so no request is missed.',
    data_flow: 'Dashboard cards summarize data from filings, documents, payments, and account records linked to your organization profile.',
    dos: 'Use it as your daily start point. Complete tasks from oldest pending to newest.',
    donts: 'Do not assume a task is complete unless status explicitly says completed or approved.',
    escalation: 'If dashboard status differs from submitted actions for more than one day, contact support with screenshots and reference IDs.'
  },
  {
    module_key: 'portal.filings',
    module_name: 'Portal Filings',
    audience: 'portal',
    how_it_works: 'Filings helps you track regulatory submissions, due dates, and filing status for your organization. Each item shows required actions and current progress.',
    what_to_do: 'Open pending filings, upload requested information, and respond quickly to clarification requests. Check due dates and resolve blockers early.',
    data_flow: 'Filing records are created by compliance workflows and updated as your submissions are reviewed and processed.',
    dos: 'Submit complete, accurate information before due date. Keep acknowledgement copies ready.',
    donts: 'Do not upload partial responses or wait until the last day for corrections.',
    escalation: 'If you cannot meet a due date or see an incorrect status, raise a support request immediately with filing name and due date.'
  },
  {
    module_key: 'portal.documents',
    module_name: 'Portal Documents',
    audience: 'portal',
    how_it_works: 'Documents is where you upload and manage business documents requested for onboarding, compliance, and service delivery.',
    what_to_do: 'Upload clear, complete files with correct document type. Replace expired or rejected files promptly and verify status after upload.',
    data_flow: 'Uploaded files are reviewed by operations/compliance teams and then marked approved, rejected, or requiring re-upload.',
    dos: 'Use readable scans/PDFs and correct categories. Keep official versions current.',
    donts: 'Do not upload unrelated files or low-quality images where details are unreadable.',
    escalation: 'If upload fails repeatedly or a valid document is rejected without clear reason, contact support with document name and upload time.'
  },
  {
    module_key: 'portal.payments',
    module_name: 'Portal Payments',
    audience: 'portal',
    how_it_works: 'Payments shows your invoices, due dates, payment status, and transaction records for plans and services purchased.',
    what_to_do: 'Pay pending invoices before due dates, keep transaction references, and verify status updates after payment completion.',
    data_flow: 'Invoice and payment data is generated from your subscriptions/services and updated from payment gateway or finance reconciliation.',
    dos: 'Download receipts and keep finance records aligned with portal history.',
    donts: 'Do not ignore overdue invoices or submit duplicate payments without checking existing status.',
    escalation: 'If a payment is debited but status is still pending, raise billing support with transaction ID and timestamp.'
  },
  {
    module_key: 'portal.account',
    module_name: 'Portal Account',
    audience: 'portal',
    how_it_works: 'Account contains your company profile data used across filings, invoices, and communications. Accurate details reduce delays and rework.',
    what_to_do: 'Keep legal name, address, registration, tax, and primary contact information up to date. Review after any organizational change.',
    data_flow: 'Account details are consumed by multiple modules including filings, billing, and support workflows.',
    dos: 'Update profile immediately after legal or contact changes.',
    donts: 'Do not leave outdated tax or contact details, as it can block filings and invoicing.',
    escalation: 'If profile edits are not saving or reflected in other modules, contact support with changed fields and expected outcome.'
  },
  {
    module_key: 'portal.contacts',
    module_name: 'Portal Contacts',
    audience: 'portal',
    how_it_works: 'Contacts manages people involved in operations, compliance, and billing communication for your organization.',
    what_to_do: 'Add role-specific contacts, keep phone/email updated, and mark the right primary contact for urgent and statutory communication.',
    data_flow: 'Contact records are referenced by notifications, support handling, and account-level workflows.',
    dos: 'Maintain at least one active backup contact for each key role.',
    donts: 'Do not keep inactive employees as primary contacts.',
    escalation: 'If contacts disappear or notifications reach wrong recipients, contact support with account ID and affected contact entries.'
  },
  {
    module_key: 'portal.activity',
    module_name: 'Portal Activity',
    audience: 'portal',
    how_it_works: 'Activity provides a timeline of important events such as submissions, approvals, requests, payment updates, and system actions.',
    what_to_do: 'Review the timeline regularly to track progress and respond to pending actions quickly.',
    data_flow: 'Events are generated by actions across portal and admin workflows and linked back to your organization context.',
    dos: 'Use activity history when raising support requests to provide exact event context.',
    donts: 'Do not ignore repeated warning events or unresolved action requests.',
    escalation: 'If expected activity events are missing or duplicated, report with approximate action time and module name.'
  }
];

const DEFAULTS_BY_KEY = Object.fromEntries(
  MODULE_INSTRUCTION_DEFAULTS.map((item) => [item.module_key, item])
) as Record<string, ModuleInstructionContent>;

export function getModuleInstructionDefault(moduleKey: string): ModuleInstructionContent | null {
  return DEFAULTS_BY_KEY[moduleKey] || null;
}
