import TenderingStub from '@/components/tendering/TenderingStub';

export default function ContractsPage() {
  return (
    <TenderingStub
      title="Contract Management"
      description="Manage the full post-award contract lifecycle — milestones, retention releases, security deposits, performance guarantees, and extensions."
      icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      accent="blue"
      features={[
        'Contract register with status tracking (Active / Completed / Terminated)',
        'Milestone tracker with due dates and completion flags',
        'Retention amount and release schedule management',
        'Security deposit and performance guarantee monitoring',
        'Contract expiry alerts and renewal workflow',
        'Amendment and extension history log',
        'Vendor performance scoring post-contract',
      ]}
    />
  );
}
