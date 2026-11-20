export default function PortalDashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-28 rounded-2xl" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton h-40 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton h-32 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-56 rounded-xl" />
      <div className="skeleton h-48 rounded-xl" />
    </div>
  );
}
