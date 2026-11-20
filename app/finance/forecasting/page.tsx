import ModuleStub from '@/components/finance/ModuleStub';

export default function ForecastingPage() {
  return (
    <ModuleStub
      title="Forecasting & Scenario Planning"
      description="12-month rolling P&L, cash flow, and balance sheet forecasts with Best / Expected / Worst case scenario modelling."
      icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      accent="amber"
      features={[
        '12-month P&L forecast with driver-based assumptions',
        'Cash flow forecast: receipts, payments, closing balance',
        'Three-scenario model: Best / Base / Worst case',
        'Sensitivity analysis: revenue, cost, headcount sliders',
        'Forecast vs actual variance tracking month-by-month',
        'CFO-approved forecast locked for board reporting',
      ]}
    />
  );
}
