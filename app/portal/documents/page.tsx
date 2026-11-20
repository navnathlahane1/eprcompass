import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { createChecklist, updateChecklistStep } from '@/lib/onboarding/templates';
import DocumentUploadForm from './DocumentUploadForm';

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export default async function DocumentsPage({ searchParams }: { searchParams?: Promise<{ view?: string }> }) {
  const view = (await searchParams)?.view || 'all';
  const supabase = await createServerComponentClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-6 text-sm text-red-700">Please sign in to manage documents.</div>;
  }

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!client) {
    return <div className="p-6 text-sm text-slate-700">No client account is linked to this profile.</div>;
  }

  async function uploadDocument(formData: FormData) {
    'use server';

    const serverSupabase = await createServerComponentClient();

    const {
      data: { user: serverUser }
    } = await serverSupabase.auth.getUser();

    if (!serverUser) return;

    const { data: serverClient } = await serverSupabase
      .from('clients')
      .select('id')
      .eq('profile_id', serverUser.id)
      .maybeSingle();

    if (!serverClient) return;

    const docTypeRaw = String(formData.get('doc_type') || '').trim();
    const file = formData.get('file') as File | null;

    if (!docTypeRaw || !file) return;

    const fileName = safeFilename(file.name);
    const docType = safeFilename(docTypeRaw);
    const storagePath = `${serverClient.id}/${docType}/${fileName}`;

    const { error: uploadError } = await serverSupabase.storage
      .from('client-docs')
      .upload(storagePath, file, {
        upsert: false,
        contentType: file.type || 'application/octet-stream'
      });

    if (uploadError) throw uploadError;

    const { error: insertError } = await serverSupabase.from('documents').insert({
      client_id: serverClient.id,
      doc_type: docTypeRaw,
      file_path: storagePath,
      uploaded_by: serverUser.id,
      status: 'Pending'
    });

    if (insertError) throw insertError;

    const docTypeLower = docTypeRaw.toLowerCase();
    const checklistId = await createChecklist('client', serverClient.id);

    if (docTypeLower.includes('gst')) {
      await updateChecklistStep(checklistId, 'gstin', true, serverUser.id).catch(() => null);
    }
    if (docTypeLower.includes('pan')) {
      await updateChecklistStep(checklistId, 'pan', true, serverUser.id).catch(() => null);
    }
    if (docTypeLower.includes('authorization') || docTypeLower.includes('authorisation') || docTypeLower.includes('auth')) {
      await updateChecklistStep(checklistId, 'auth_letter', true, serverUser.id).catch(() => null);
    }

    revalidatePath('/portal/documents');
    revalidatePath('/portal/filings');
  }

  async function deleteDocument(formData: FormData) {
    'use server';

    const serverSupabase = await createServerComponentClient();

    const {
      data: { user: serverUser }
    } = await serverSupabase.auth.getUser();

    if (!serverUser) return;

    const documentId = String(formData.get('document_id') || '');
    if (!documentId) return;

    const { data: documentRow } = await serverSupabase
      .from('documents')
      .select('id, file_path, uploaded_by, client_id')
      .eq('id', documentId)
      .maybeSingle();

    if (!documentRow) return;

    if (documentRow.uploaded_by !== serverUser.id) {
      throw new Error('You can delete only your own documents.');
    }

    const { data: serverClient } = await serverSupabase
      .from('clients')
      .select('id')
      .eq('profile_id', serverUser.id)
      .maybeSingle();

    if (!serverClient || documentRow.client_id !== serverClient.id) return;

    await serverSupabase.storage.from('client-docs').remove([documentRow.file_path]);

    const { error: deleteError } = await serverSupabase.from('documents').delete().eq('id', documentId);
    if (deleteError) throw deleteError;

    revalidatePath('/portal/documents');
    revalidatePath('/portal/filings');
  }

  const { data: documents } = await supabase
    .from('documents')
    .select('id, doc_type, status, expiry_date, file_path, uploaded_by, created_at')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false });

  const documentsWithUrls = await Promise.all(
    (documents ?? []).map(async (document) => {
      let viewUrl = document.file_path;
      if (document.file_path) {
        const { data: signed } = await supabase.storage
          .from('client-docs')
          .createSignedUrl(document.file_path, 300);
        if (signed?.signedUrl) viewUrl = signed.signedUrl;
      }
      return { ...document, viewUrl };
    })
  );

  const today = new Date();
  const expiringCutoff = new Date(today);
  expiringCutoff.setDate(expiringCutoff.getDate() + 60);
  const visibleDocuments = documentsWithUrls.filter((document) => {
    if (view === 'pending') return document.status === 'Pending';
    if (view === 'expiring') {
      if (!document.expiry_date) return false;
      const expiry = new Date(`${document.expiry_date}T00:00:00`);
      return expiry <= expiringCutoff;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Documents</h1>
        <p className="mt-1 text-sm text-slate-600">One pipeline for uploads, review, filing evidence, expiry, and secure portal access.</p>
      </div>

      <nav className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2" aria-label="Document views">
        {[
          { label: 'All documents', href: '/portal/documents', active: view === 'all' },
          { label: 'Pending review', href: '/portal/documents?view=pending', active: view === 'pending' },
          { label: 'Expiring', href: '/portal/documents?view=expiring', active: view === 'expiring' },
          { label: 'Vault & CPCB', href: '/portal/compliance-vault', active: false },
        ].map((item) => (
          <Link key={item.href} href={item.href} className={`rounded-lg px-3 py-2 text-sm font-semibold ${item.active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {item.label}
          </Link>
        ))}
      </nav>

      <DocumentUploadForm uploadAction={uploadDocument} />

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleDocuments.map((document) => {
          const isOwner = document.uploaded_by === user.id;
          const statusClass =
            document.status === 'Verified'
              ? 'bg-emerald-100 text-emerald-800'
              : document.status === 'Expired'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-amber-100 text-amber-800';

          return (
            <article key={document.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{document.doc_type}</p>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>
                  {document.status}
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-500">Expiry: {document.expiry_date || 'N/A'}</p>

              <a
                href={document.viewUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                Open file
              </a>

              {isOwner ? (
                <form action={deleteDocument} className="mt-3">
                  <input type="hidden" name="document_id" value={document.id} />
                  <button
                    type="submit"
                    className="inline-flex rounded-md border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </form>
              ) : (
                <p className="mt-3 text-xs text-slate-500">Only uploader can delete this document.</p>
              )}
            </article>
          );
        })}
        {visibleDocuments.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-500">
            No documents in this view.
          </div>
        ) : null}
      </section>
    </div>
  );
}
