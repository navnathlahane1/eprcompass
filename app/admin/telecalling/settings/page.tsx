import TelecallingSubNav from '@/components/telecalling/TelecallingSubNav';
import SettingsClient from './SettingsClient';

export const metadata = { title: 'TC Settings' };

export default function SettingsPage() {
  return (
    <div className="p-6">
      <TelecallingSubNav active="settings" />
      <div className="max-w-4xl space-y-6">
        <SettingsClient />

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-base font-semibold text-slate-100">Regulatory Notification Upload</h2>
          <p className="mt-2 text-sm text-slate-500">
            Notification upload now has its own telecalling menu entry so the workflow is easier to find and open directly.
          </p>
          <div className="mt-4">
            <a
              href="/admin/telecalling/notifications"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Open Notification Upload
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
