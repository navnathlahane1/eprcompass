import TenderingStub from '@/components/tendering/TenderingStub';

export default function TenderingCalendarPage() {
  return (
    <TenderingStub
      title="Tendering Calendar"
      description="Visualise all critical dates — submission deadlines, EMD deposit windows, bid openings, and corrigendum dates — on a unified calendar."
      icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      accent="amber"
      features={[
        'Monthly and weekly calendar view of all tender deadlines',
        'EMD deposit date reminders with bank holiday awareness',
        'Bid opening and result date tracking',
        'Corrigendum notification timeline',
        'Color-coded urgency indicators',
        'Export calendar to iCal / Google Calendar',
      ]}
    />
  );
}
