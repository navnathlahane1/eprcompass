export default function PartnerDashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-12 rounded-xl" />
      <div className="skeleton h-20 rounded-xl" />
      <div className="skeleton h-36 rounded-xl" />
      <div className="skeleton h-10 rounded-lg" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="skeleton h-64 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    </div>
  );
}
