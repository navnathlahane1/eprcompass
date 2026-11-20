'use client';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="text-center">
        <p className="text-5xl font-bold text-slate-600">Error</p>
        <h2 className="mt-3 text-lg font-semibold text-slate-100">Something went wrong</h2>
        <p className="mt-1 max-w-md text-sm text-slate-400">
          An error occurred while loading this page. Please try again or contact support.
        </p>
        {error?.digest && (
          <p className="mt-2 font-mono text-xs text-slate-500">ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
