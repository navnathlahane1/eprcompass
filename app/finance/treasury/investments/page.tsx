import ModuleStub from '@/components/finance/ModuleStub';

export default function InvestmentsPage() {
  return (
    <ModuleStub
      title="Investments"
      description="Track Fixed Deposits, mutual funds, bonds, and other investments — maturity dates, returns, and portfolio summary."
      icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      accent="violet"
      features={[
        'FD register: bank, amount, rate, maturity date',
        'Mutual fund holdings with NAV and returns tracking',
        'Investment maturity calendar and rollover alerts',
        'Portfolio summary: FD vs MF vs bonds allocation',
        'Interest income accrual for P&L recognition',
        'TDS on interest income tracking and Form 26AS match',
      ]}
    />
  );
}
