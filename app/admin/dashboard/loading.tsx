export default function LoadingDashboard() {
  return (
    <div role="status" aria-label="Loading overview" className="mx-auto max-w-[1600px] space-y-6">
      <span className="sr-only">Loading overview</span>
      <div className="h-14 animate-pulse rounded-md bg-zinc-200" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-lg bg-zinc-200" />)}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-lg bg-zinc-200" />)}
      </div>
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-12">
        <div className="h-72 animate-pulse bg-zinc-200 2xl:col-span-8" />
        <div className="h-72 animate-pulse bg-zinc-200 2xl:col-span-4" />
      </div>
    </div>
  );
}
