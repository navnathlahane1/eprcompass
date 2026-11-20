import ModuleStub from '@/components/finance/ModuleStub';

export default function CompliancePage() {
  return (
    <ModuleStub
      title="Compliance & Governance"
      description="Corporate, financial, and internal control compliance — ROC filings, board meetings, auditor deadlines, and SEBI/RBI requirements."
      icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      accent="emerald"
      features={[
        'MCA/ROC filing calendar (AOC-4, MGT-7, DIR-3 KYC)',
        'Board meeting minutes and resolution repository',
        'Statutory audit and internal audit status tracker',
        'SEBI LODR / FEMA / RBI compliance checklist',
        'Internal control self-assessment (ICFR) framework',
        'Compliance health score with risk-weighted dashboard',
      ]}
    />
  );
}
