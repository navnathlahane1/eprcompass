import ModuleStub from '@/components/finance/ModuleStub';

export default function ProfitabilityPage() {
  return (
    <ModuleStub
      title="Profitability Management"
      description="Gross margin, net profit, EBITDA analytics and cost allocation across departments and service lines."
      icon="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      accent="violet"
      features={[
        'Gross profit margin by client, service, and region',
        'Net profit with EBITDA and EBIT breakdown',
        'Cost allocation engine — direct vs indirect costs',
        'Contribution margin analysis by product/service',
        'Monthly profitability trend with drill-down',
        'Break-even analysis and sensitivity scenarios',
      ]}
    />
  );
}
