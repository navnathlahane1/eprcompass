export default function ServiceCard({ title, description }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-eco-green-4/40 hover:shadow-md">
      <div className="mb-3 h-1 w-10 rounded-full bg-eco-green-4" />
      <h3 className="text-sm font-bold text-eco-navy">{title}</h3>
      <p className="mt-1.5 text-sm text-gray-500">{description}</p>
    </article>
  );
}