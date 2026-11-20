import TelecallingSubNav from '@/components/telecalling/TelecallingSubNav';
import AnalyticsClient from './AnalyticsClient';

export const metadata = { title: 'TC Analytics' };

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <TelecallingSubNav active="analytics" />
      <AnalyticsClient />
    </div>
  );
}
