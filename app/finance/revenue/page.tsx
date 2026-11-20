import ModuleStub from '@/components/finance/ModuleStub';

export default function RevenuePage() {
  return (
    <ModuleStub
      title="Revenue Management"
      description="Comprehensive revenue analytics, deferred revenue tracking, and revenue recognition across all service lines."
      icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      features={[
        'Revenue by service line, geography, and client segment',
        'MoM and YoY revenue trend analysis with charts',
        'Deferred revenue schedule and recognition tracking',
        'Revenue forecast vs actual comparison',
        'Client lifetime value and revenue concentration alerts',
        'GST output tax reconciliation with revenue',
      ]}
    />
  );
}
