import TenderingStub from '@/components/tendering/TenderingStub';

export default function TenderingAnalyticsPage() {
  return (
    <TenderingStub
      title="Analytics"
      description="Data-driven insights into your tendering performance — win rates, category analysis, portal ROI, team productivity, and trend forecasting."
      icon="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      accent="violet"
      features={[
        'Win rate trend over time (monthly / quarterly)',
        'Category-wise success rate breakdown',
        'Portal ROI analysis — which portals yield most wins',
        'Bid value vs L1 variance analysis',
        'Team member performance metrics',
        'Tender pipeline conversion funnel',
        'Contract value realised vs total bids placed',
      ]}
    />
  );
}
