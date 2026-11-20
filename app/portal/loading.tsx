export default function PortalLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-slate-200" />
    </div>
  );
}
