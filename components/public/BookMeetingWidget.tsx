import Link from 'next/link';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { meetingRequestHref } from '@/lib/meetingRequest';

export default function BookMeetingWidget({ slug }: { slug: string }) {
  return (
    <div className="rounded-2xl border border-[#e4d5ee] bg-[#f0e6fa] p-6">
      <div className="flex items-start gap-4">
        <span className="rounded-xl bg-white p-3 text-[#3f1b66]"><CalendarDays size={20} /></span>
        <div className="flex-1">
          <h2 className="text-base font-bold text-[#281d39]">Request a meeting</h2>
          <p className="mt-1 text-sm leading-6 text-[#72627e]">Share your details and our team will contact you to arrange a suitable time with this recycler.</p>
          <Link
            href={meetingRequestHref('recycler_profile', { recycler: slug })}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#3f1b66] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Request a meeting <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
