'use client';

export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <p className="text-5xl font-bold text-slate-300">Error</p>
        <h2 className="mt-3 text-lg font-semibold text-slate-900">Something went wrong</h2>
        <p className="mt-1 max-w-md text-sm text-slate-600">
          We couldn&apos;t load your portal data. Please try again.
        </p>
        {error?.digest && (
          <p className="mt-2 font-mono text-xs text-slate-400">ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
