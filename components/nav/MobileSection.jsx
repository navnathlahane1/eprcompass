'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Mobile accordion section. One per top-level navigation group.
 * The hidden panel keeps the disclosure's aria-controls target available.
 */
export default function MobileSection({ title, children, isActive = false, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  return (
    <li>
      <button
        type="button"
        className={`w-full flex items-center justify-between py-3 min-h-[44px] font-bold hover:text-[#07875f] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#07875f] rounded ${isActive ? 'text-[#07875f]' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span>{title}</span>
        <ChevronDown
          className={`w-5 h-5 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      <div id={panelId} hidden={!open} className="pl-4 pb-2">{children}</div>
    </li>
  );
}
