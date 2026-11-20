import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import TourTarget from '@/components/portal/tour/TourTarget';

export const metadata = {
  title: 'Documents | Partner Portal',
  description: 'Access partner agreements, compliance guides, and co-branded materials.',
};

const TYPE_COLOR: Record<string, string> = {
  Agreement: 'bg-indigo-100 text-indigo-800',
  Guide:     'bg-emerald-100 text-emerald-800',
  Marketing: 'bg-blue-100 text-blue-800',
  Policy:    'bg-amber-100 text-amber-800',
  Template:  'bg-violet-100 text-violet-800',
  Other:     'bg-slate-100 text-slate-700',
};

export default async function PartnerDocumentsPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: docs } = await (supabase as any)
    .from('partner_documents')
    .select('id, name, doc_type, description, url, created_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  const rows = docs || [];

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">Documents</h1>
        <p className="mt-1 text-sm text-slate-600">
          Partner agreements, compliance resources, and co-branded materials.
        </p>
      </section>

      {rows.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-700">No documents available yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Check back soon or contact{' '}
            <a href="mailto:supporteprcompass@gmail.com" className="font-medium text-indigo-600 hover:underline">supporteprcompass@gmail.com</a>
          </p>
        </section>
      ) : (
        <TourTarget id="documents-grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((doc: any) => (
            <article key={doc.id} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{doc.name}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLOR[doc.doc_type] || TYPE_COLOR.Other}`}>
                  {doc.doc_type}
                </span>
              </div>
              {doc.description && (
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{doc.description}</p>
              )}
              <p className="mt-2 text-xs text-slate-400">
                Added:{' '}
                {new Date(doc.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
              <div className="mt-auto pt-3">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </div>
            </article>
          ))}
        </TourTarget>
      )}
    </div>
  );
}
