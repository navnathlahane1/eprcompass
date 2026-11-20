import ModuleStub from '@/components/finance/ModuleStub';

export default function BoardPage() {
  return (
    <ModuleStub
      title="Board Reporting"
      description="One-click board pack generation — P&L, cash position, KPIs, risk summary, and strategic metrics in PDF, Excel, or PowerPoint."
      icon="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
      accent="blue"
      features={[
        'One-click board pack: auto-compiled from live data',
        'CFO commentary and narrative section',
        'KPI scorecard with traffic-light RAG status',
        'Financial highlights: revenue, EBITDA, cash, AR/AP',
        'Export to PDF (presentation), Excel (data), PPT (slides)',
        'Board meeting archive and version history',
      ]}
    />
  );
}
