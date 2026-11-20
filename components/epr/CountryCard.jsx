import Link from 'next/link';

const categoryIcons = {
  Plastic: '🧴',
  'E-Waste': '♻️',
  Battery: '🔋',
  Tyre: '🚗',
  Packaging: '📦',
};

export default function CountryCard({ country }) {
  const isActive = country.status === 'active';

  return (
    <article className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-eco-green-4/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-eco-navy">
          <span className="mr-2 text-xl" aria-hidden="true">{country.flag}</span>
          {country.name}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isActive
              ? 'bg-eco-green-4/10 text-eco-green-4'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {country.status}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-xs text-gray-500">{country.regulation}</p>

      <div className="mt-3 flex flex-wrap gap-1.5 text-base" aria-label="Waste categories">
        {country.categories.map((category) => (
          <span
            key={category}
            title={category}
            className="rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-600"
          >
            {categoryIcons[category] || '📦'} {category}
          </span>
        ))}
      </div>

      <Link
        href={`/epr/${country.slug}`}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-eco-green-4 transition group-hover:text-eco-green-5"
      >
        Get EPR Services
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </article>
  );
}