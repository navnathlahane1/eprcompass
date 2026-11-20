'use client';

import { useEffect, useRef } from 'react';

interface Props {
  text: string;
  loading: boolean;
  placeholder?: string;
  className?: string;
}

// Renders streaming Claude output. Auto-scrolls as text arrives.
export default function StreamingOutput({ text, loading, placeholder, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [text]);

  return (
    <div
      ref={ref}
      className={`relative min-h-[120px] rounded-xl border border-slate-800/60 bg-[#020817] p-4 font-mono text-sm text-slate-300 overflow-y-auto ${className ?? ''}`}
    >
      {loading && text === '' && (
        <div className="flex items-center gap-2 text-slate-600 text-xs">
          <span className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </span>
          Generating…
        </div>
      )}

      {!loading && text === '' && (
        <p className="text-slate-700 italic text-xs">{placeholder ?? 'Output will appear here.'}</p>
      )}

      {text && (
        <pre className="whitespace-pre-wrap break-words leading-relaxed text-xs">{text}</pre>
      )}

      {loading && text !== '' && (
        <span className="inline-block h-4 w-0.5 bg-emerald-400 animate-pulse align-middle ml-0.5" />
      )}
    </div>
  );
}
