import TenderingStub from '@/components/tendering/TenderingStub';

export default function BidTrackerPage() {
  return (
    <TenderingStub
      title="Bid Tracker"
      description="Centralised dashboard to manage the entire bid lifecycle — from draft preparation through internal review, approval, and submission."
      icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      accent="amber"
      features={[
        'Kanban-style bid status board (Draft → Review → Approved → Submitted)',
        'Approval workflow with comment threads',
        'Bid document checklist with completeness score',
        'Deadline alerts for internal review milestones',
        'Version history for bid price revisions',
        'One-click submission confirmation with audit trail',
      ]}
    />
  );
}
