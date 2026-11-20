import TelecallingSubNav from '@/components/telecalling/TelecallingSubNav';
import LeadsClient from './LeadsClient';

export const metadata = { title: 'TC Leads' };

export default function TeleLeadsPage() {
  return (
    <div className="p-6">
      <TelecallingSubNav active="leads" />
      <LeadsClient />
    </div>
  );
}
