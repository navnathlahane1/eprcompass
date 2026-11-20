export default function TyreEprComingSoonCard() {
  return (
    <section
      aria-label="Tyre EPR – Coming Soon"
      className="rounded-xl border border-gray-200 bg-gray-50 p-5 opacity-60 dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Tyre EPR</h2>
        <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          Coming Soon
        </span>
      </div>
      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        Tyre EPR compliance tracking will be available in an upcoming release.
      </p>
    </section>
  );
}
