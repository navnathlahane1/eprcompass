export default function ComplianceLoading() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-200" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
            </div>
            <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-slate-200" />
            <div className="mt-3 h-3 w-56 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
