import TelecallingSubNav from '@/components/telecalling/TelecallingSubNav';
import NotificationUploadPanel from '../settings/NotificationUploadPanel';

export const metadata = { title: 'Telecalling Notifications' };

export default function TelecallingNotificationsPage() {
  return (
    <div className="p-6">
      <TelecallingSubNav active="notifications" />
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-100">Regulatory Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload and index CPCB or MoEF&amp;CC circulars without going through telecalling settings.
          </p>
        </div>
        <NotificationUploadPanel />
      </div>
    </div>
  );
}