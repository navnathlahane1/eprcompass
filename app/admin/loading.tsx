export default function AdminLoading() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-800" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-800" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-slate-800" />
    </div>
  );
}
