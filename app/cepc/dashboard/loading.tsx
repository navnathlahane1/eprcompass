export default function CEPCDashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-10 rounded-xl" />
      <div className="skeleton h-24 rounded-xl" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-72 rounded-xl" />
      <div className="skeleton h-56 rounded-xl" />
      <div className="skeleton h-56 rounded-xl" />
    </div>
  );
}
