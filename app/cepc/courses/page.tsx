export const metadata = {
  title: 'My Courses | CEPC Portal',
  description: 'Track your enrolled EPR certification courses and progress.',
};

const courses = [
  { name: 'EPR Fundamentals — Plastic Waste', category: 'Plastic', progress: 100, status: 'Completed' },
  { name: 'E-Waste Compliance Masterclass', category: 'E-Waste', progress: 72, status: 'In Progress' },
  { name: 'Battery EPR — Registration & Returns', category: 'Battery', progress: 45, status: 'In Progress' },
  { name: 'Used Oil Recycling Regulations', category: 'Used Oil', progress: 0, status: 'Not Started' },
  { name: 'Tyre Waste EPR Framework', category: 'Tyre', progress: 100, status: 'Completed' },
  { name: 'Advanced Filing & Annual Returns', category: 'General', progress: 18, status: 'In Progress' },
];

function statusColor(status: string) {
  if (status === 'Completed') return 'bg-emerald-100 text-emerald-800';
  if (status === 'In Progress') return 'bg-blue-100 text-blue-800';
  return 'bg-slate-100 text-slate-600';
}

export default function CepcCoursesPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">My Courses</h1>
        <p className="mt-1 text-sm text-slate-600">EPR certification courses you are enrolled in.</p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => (
          <article key={c.name} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{c.name}</p>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(c.status)}`}>{c.status}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{c.category}</p>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Progress</span>
                <span className="font-semibold">{c.progress}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${c.progress}%` }}
                />
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
