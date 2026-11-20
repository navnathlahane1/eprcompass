import ModuleStub from '@/components/finance/ModuleStub';

export default function BalanceSheetPage() {
  return (
    <ModuleStub
      title="Balance Sheet"
      description="Assets, liabilities and equity snapshot — consolidated view with current vs non-current classification."
      icon="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
      accent="blue"
      features={[
        'Current and non-current assets with aging',
        'Liability classification: short-term vs long-term',
        'Equity components: share capital, reserves, retained earnings',
        'Fixed assets schedule with net book value',
        'Working capital ratio and liquidity ratios',
        'MCA-compliant Schedule III format export',
      ]}
    />
  );
}
