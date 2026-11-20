export default function RecyclerDashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-12 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton h-40 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-12 rounded-lg" />
      <div className="skeleton h-80 rounded-xl" />
    </div>
  );
}
