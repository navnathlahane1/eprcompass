'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-7xl font-bold text-gray-300">500</p>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-gray-600">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        {error?.digest && (
          <p className="mt-2 font-mono text-xs text-gray-400">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          type="button"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
