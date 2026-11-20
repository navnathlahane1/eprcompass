import ModuleStub from '@/components/finance/ModuleStub';

export default function AuditPage() {
  return (
    <ModuleStub
      title="Audit Management"
      description="Internal and statutory audit planning, observation tracking, document repository, and auditor communication portal."
      icon="M9 5l7 7-7 7"
      accent="violet"
      features={[
        'Audit calendar: internal, statutory, tax, cost audit',
        'Audit observation register with severity rating',
        'Corrective action plan (CAP) and closure tracking',
        'Document repository for auditor data requests',
        'Audit trail and exception reports',
        'Big-4 / CA firm communication and deliverable tracker',
      ]}
    />
  );
}
