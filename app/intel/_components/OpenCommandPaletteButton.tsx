'use client';

export function OpenCommandPaletteButton() {
  return (
    <button
      type="button"
      aria-label="Open command palette (⌘K)"
      onClick={() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
      }}
      className="hidden items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-[10px] text-slate-400 transition hover:border-teal-500/50 hover:text-teal-300 sm:flex"
    >
      <kbd className="font-mono">⌘K</kbd>
      <span>Search</span>
    </button>
  );
}
