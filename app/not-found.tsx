import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-7xl font-bold text-gray-300">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm text-gray-600">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/admin/dashboard"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
