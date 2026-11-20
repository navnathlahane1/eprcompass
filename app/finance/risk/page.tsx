import ModuleStub from '@/components/finance/ModuleStub';

export default function RiskPage() {
  return (
    <ModuleStub
      title="Risk Management"
      description="Financial, operational, and legal risk register with probability-impact heat map, mitigation tracking, and CFO alerts."
      icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      accent="rose"
      features={[
        'Risk register: financial, operational, legal, strategic',
        'Probability × Impact heat map (5×5 matrix)',
        'Risk owner assignment and mitigation action tracking',
        'Credit risk scoring for top customers',
        'FX exposure and currency risk hedging tracker',
        'Risk appetite statement vs current exposure alerts',
      ]}
    />
  );
}
