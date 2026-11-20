import ModuleStub from '@/components/finance/ModuleStub';

export default function PLPage() {
  return (
    <ModuleStub
      title="Profit & Loss Statement"
      description="Comprehensive P&L with revenue, COGS, operating expenses, EBITDA, and net profit — monthly, quarterly, and annual."
      icon="M7 21h10M12 3v18M5 9l7-6 7 6"
      accent="emerald"
      features={[
        'Revenue breakdown: service fees, compliance, consulting',
        'COGS and gross margin with period comparison',
        'Operating expense waterfall: salaries, rent, marketing',
        'EBITDA, EBIT, PBT, PAT with % of revenue',
        'YTD vs prior year with variance column',
        'Export to PDF, Excel (Tally-compatible format)',
      ]}
    />
  );
}
