import ModuleStub from '@/components/finance/ModuleStub';

export default function CashFlowPage() {
  return (
    <ModuleStub
      title="Cash Flow Statement"
      description="Indirect method cash flow from operations, investing, and financing activities with free cash flow computation."
      icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      accent="amber"
      features={[
        'Operating cash flow (indirect method from P&L)',
        'Investing activities: CapEx, asset disposals, investments',
        'Financing activities: loans, repayments, dividends',
        'Free cash flow = Operating CF − CapEx',
        'Cash burn rate and runway calculator',
        'Monthly waterfall chart with opening/closing balance',
      ]}
    />
  );
}
