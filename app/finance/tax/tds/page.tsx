import ModuleStub from '@/components/finance/ModuleStub';

export default function TDSPage() {
  return (
    <ModuleStub
      title="TDS Management"
      description="TDS deduction tracking, challan payment records, 24Q/26Q return filing status, and Form 16/16A generation."
      icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      accent="amber"
      features={[
        'TDS deductee ledger with PAN and section tracking',
        'Challan (ITNS 281) payment history',
        '24Q (salary) and 26Q (non-salary) return status',
        'Form 16 / 16A generation tracker',
        'TDS default and late payment interest calculator',
        'Quarterly return due date calendar with alerts',
      ]}
    />
  );
}
