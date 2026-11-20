'use client';

import { useFormStatus } from 'react-dom';

type Props = {
  uploadAction: (formData: FormData) => Promise<void>;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Uploading...' : 'Upload Document'}
    </button>
  );
}

export default function DocumentUploadForm({ uploadAction }: Props) {
  return (
    <form action={uploadAction} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
      <div className="sm:col-span-1">
        <label htmlFor="doc_type" className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">
          Document Type
        </label>
        <input
          id="doc_type"
          name="doc_type"
          required
          placeholder="e.g. Certificate"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-300 focus:ring"
        />
      </div>

      <div className="sm:col-span-1">
        <label htmlFor="file" className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">
          File
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-300 focus:ring"
        />
      </div>

      <div className="flex items-end sm:col-span-1">
        <SubmitButton />
      </div>
    </form>
  );
}
