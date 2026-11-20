import ModuleStub from '@/components/finance/ModuleStub';

export default function IncomeTaxPage() {
  return (
    <ModuleStub
      title="Income Tax"
      description="Advance tax computation and payment tracking, ITR filing status, MAT/AMT calculation, and tax provision management."
      icon="M3 21l1.9-5.7a8.5 8.5 0 113.8 3.8z"
      accent="rose"
      features={[
        'Advance tax liability estimator (4 installments)',
        'Challan (ITNS 280) payment records',
        'ITR filing tracker — due dates and status',
        'MAT / AMT calculation with book profit',
        'Tax provision and deferred tax tracking',
        'Tax savings opportunities and 80C/80D alerts',
      ]}
    />
  );
}
