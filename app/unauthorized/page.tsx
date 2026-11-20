import Link from 'next/link';

export const metadata = {
  title: 'Unauthorized | EPR Compass',
  description: 'You do not have permission to access this page.',
};

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-7xl font-bold text-gray-300">403</p>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">You don&apos;t have access to this page</h1>
        <p className="mt-2 max-w-md text-sm text-gray-600">
          Your current role does not include permission to view this resource. If you believe this is an error, contact your administrator or switch to the correct account.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Sign in with a different account
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

