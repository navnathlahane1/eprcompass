import ModuleStub from '@/components/finance/ModuleStub';

export default function BudgetsPage() {
  return (
    <ModuleStub
      title="Budgeting & Planning"
      description="Annual budget planning, departmental allocations, and real-time budget vs actual variance analysis."
      icon="M9 7H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-2M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M9 7h6m-3 4v6m-2-2h4"
      accent="blue"
      features={[
        'Department-wise annual budget creation and approval',
        'Monthly budget vs actual with variance flags (>10%)',
        'Rolling forecast updated monthly with actuals',
        'Top-down and bottom-up budget consolidation',
        'Cost center tracking and allocation engine',
        'Board-ready budget summary with waterfall charts',
      ]}
    />
  );
}
