import Link from 'next/link';

export const metadata = {
  title: 'Compliance Resources | EPR Compass',
  description: 'Explore compliance resources and EPR service modules with practical guidance and implementation support.',
};

export default function RegulatoryPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 pt-6 pb-16">
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 font-tangent">
          Compliance Resource Hub
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          This legacy module has been retired. Use the updated EPR services pages and resource hub for the latest compliance guidance.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/services" className="inline-flex items-center px-6 py-3 rounded-xl bg-eco-green-4 text-white font-medium hover:bg-eco-green-5 transition">
            Explore Services
          </Link>
          <Link href="/resources" className="inline-flex items-center px-6 py-3 rounded-xl border-2 border-eco-green-4 text-eco-green-4 font-medium hover:bg-eco-green-4 hover:text-white transition">
            Open Resources
          </Link>
        </div>
      </section>
    </main>
  );
}

