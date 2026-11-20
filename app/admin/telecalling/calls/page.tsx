import TelecallingSubNav from '@/components/telecalling/TelecallingSubNav';
import CallsClient from './CallsClient';

export const metadata = { title: 'TC Calls' };

export default function CallsPage() {
  return (
    <div className="p-6">
      <TelecallingSubNav active="calls" />
      <CallsClient />
    </div>
  );
}
