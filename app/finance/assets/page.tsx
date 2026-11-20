import ModuleStub from '@/components/finance/ModuleStub';

export default function AssetsPage() {
  return (
    <ModuleStub
      title="Fixed Asset Management"
      description="Asset register, depreciation schedules (SLM & WDV), net book value tracking, and CapEx planning."
      icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      accent="amber"
      features={[
        'Asset register with category, location, and custodian',
        'Depreciation auto-calculation (SLM and WDV methods)',
        'Net book value (NBV) schedule and useful life tracker',
        'Asset disposal and write-off management',
        'CapEx budget vs actual with approval workflow',
        'Physical verification log and asset tagging',
      ]}
    />
  );
}
