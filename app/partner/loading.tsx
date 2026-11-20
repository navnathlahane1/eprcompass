export default function PartnerLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-xl bg-slate-200" />
    </div>
  );
}
