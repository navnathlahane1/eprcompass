import TenderingStub from '@/components/tendering/TenderingStub';

export default function SubmittedTendersPage() {
  return (
    <TenderingStub
      title="Submitted Tenders"
      description="Track all tenders where bids have been submitted. Monitor opening dates, results, and L1 amounts as they are announced."
      icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      accent="blue"
      features={[
        'Complete list of submitted bids with submission timestamps',
        'Bid opening date countdown',
        'L1 amount entry once results are declared',
        'Win / loss outcome tracking with margin analysis',
        'Corrigendum received post-submission tracking',
        'Demand note and award letter upload',
      ]}
    />
  );
}
