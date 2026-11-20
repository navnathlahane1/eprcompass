import TelecallingSubNav from '@/components/telecalling/TelecallingSubNav';
import FollowupsClient from './FollowupsClient';

export const metadata = { title: 'TC Follow-ups' };

export default function FollowupsPage() {
  return (
    <div className="p-6">
      <TelecallingSubNav active="followups" />
      <FollowupsClient />
    </div>
  );
}
