export default function EprDashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-busy="true" aria-label="Loading EPR Dashboard">
      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        <div className="h-9 w-36 rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="h-9 w-36 rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="h-9 w-36 rounded-md bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Score + liability row */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* State + product row */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="h-80 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-80 rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}
