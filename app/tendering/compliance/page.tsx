import TenderingStub from '@/components/tendering/TenderingStub';

export default function TenderingCompliancePage() {
  return (
    <TenderingStub
      title="Compliance Monitor"
      description="Stay on top of all compliance obligations — EMD refunds, bid validity expirations, blacklist checks, and statutory declaration tracking."
      icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      accent="rose"
      features={[
        'EMD deposit tracking with refund status',
        'Bid validity expiry alerts with extension workflow',
        'Vendor blacklist cross-check against CPPP / GeM',
        'PAN and GSTIN verification status',
        'Statutory declaration (turnover, experience) tracking',
        'Compliance checklist per tender type',
        'Audit trail for all compliance actions taken',
      ]}
    />
  );
}
