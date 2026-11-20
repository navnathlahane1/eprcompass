import TelecallingSubNav from '@/components/telecalling/TelecallingSubNav';
import ScriptsClient from './ScriptsClient';

export const metadata = { title: 'Call Scripts' };

export default function ScriptsPage() {
  return (
    <div className="p-6">
      <TelecallingSubNav active="scripts" />
      <div className="mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
        <a href="/admin/telecalling/scripts" className="rounded-md bg-blue-900/30 px-3 py-1.5 text-sm font-semibold text-blue-300">Scripts</a>
        <a href="/admin/telecalling/email-templates" className="rounded-md px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-900">Emails</a>
      </div>
      <ScriptsClient />
    </div>
  );
}
