import TenderingStub from '@/components/tendering/TenderingStub';

export default function TechnicalEvaluationPage() {
  return (
    <TenderingStub
      title="Technical Evaluation"
      description="Structured scoring matrix for evaluating vendor technical bids. Assign criteria weights, score submissions, and generate comparative reports."
      icon="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
      accent="violet"
      features={[
        'Configurable scoring criteria with custom weightings',
        'Per-vendor technical score entry with remarks',
        'Combined score auto-calculation (60:40 technical:financial)',
        'Ranking table for all evaluated vendors',
        'Committee member score aggregation',
        'Technical qualification threshold enforcement',
        'PDF evaluation report generation',
      ]}
    />
  );
}
