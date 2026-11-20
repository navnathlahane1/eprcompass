import ModuleStub from '@/components/finance/ModuleStub';

export default function CashForecastPage() {
  return (
    <ModuleStub
      title="Cash Forecast"
      description="12-month rolling cash flow projection — inflows, outflows, and closing balance by month with variance to actuals."
      icon="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v16H4V4z"
      accent="emerald"
      features={[
        'Monthly inflow forecast: collections, advance receipts',
        'Monthly outflow forecast: payroll, vendor, tax, rent',
        'Net cash position and closing balance projection',
        'Actuals overlay: forecast vs actual comparison',
        'Cash buffer alerts when balance drops below threshold',
        'Scenario: Best / Base / Worst case cash projections',
      ]}
    />
  );
}
