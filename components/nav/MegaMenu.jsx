'use client';

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const CLOSE_DELAY_MS = 220;

const MegaOpenContext = createContext(null);

export function MegaMenuScope({ children }) {
  const [openId, setOpenId] = useState(null);
  return (
    <MegaOpenContext.Provider value={{ openId, setOpenId }}>
      {children}
    </MegaOpenContext.Provider>
  );
}

/**
 * Desktop mega-menu. Only one panel is open at a time (shared scope).
 * Panel is opaque white and sits flush under the sticky header.
 */
export default function MegaMenu({ label, width = 'full', children, active = false }) {
  const id = useId();
  const ctx = useContext(MegaOpenContext);
  const [localOpen, setLocalOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const setOpenId = ctx?.setOpenId;
  const closeTimerRef = useRef(null);

  const open = ctx ? ctx.openId === id : localOpen;

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openNow = () => {
    cancelClose();
    if (ctx) ctx.setOpenId(id);
    else setLocalOpen(true);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      if (ctx) {
        ctx.setOpenId((current) => (current === id ? null : current));
      } else {
        setLocalOpen(false);
      }
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  };

  const dismiss = useCallback(() => {
    if (setOpenId) setOpenId((current) => (current === id ? null : current));
    else setLocalOpen(false);
  }, [id, setOpenId]);

  const close = useCallback(() => {
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    dismiss();
  }, [dismiss]);

  useEffect(() => () => cancelClose(), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        close();
        if (containerRef.current?.contains(document.activeElement)) triggerRef.current?.focus();
      }
    };
    const onPointer = (e) => {
      if (!containerRef.current?.contains(e.target)) close();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open, close]);

  return (
    <li
      className="relative flex h-[64px] items-center"
      ref={containerRef}
      onMouseLeave={scheduleClose}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`relative z-[2] flex h-full items-center gap-1 whitespace-nowrap text-[14px] font-bold transition hover:text-[#07875f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#07875f] rounded-sm after:absolute after:bottom-[9px] after:left-0 after:h-0.5 after:w-full after:origin-left after:bg-[#07875f] after:transition-transform ${open || active ? 'text-[#07875f] after:scale-x-100' : 'text-[#102c32] after:scale-x-0 hover:after:scale-x-100'}`}
        onClick={() => (open ? close() : openNow())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') { event.preventDefault(); openNow(); }
        }}
        aria-controls={`${id}-panel`}
        aria-expanded={open}
      >
        {label}
        <ChevronDown
          className={`w-3.5 h-3.5 ml-0.5 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth="2.4"
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          id={`${id}-panel`}
          aria-label={label}
          onMouseEnter={openNow}
          onMouseLeave={scheduleClose}
          className="fixed inset-x-0 z-[60] max-h-[calc(100dvh-var(--nav-offset,64px))] overflow-y-auto overscroll-contain animate-epr-mega border-b border-[#dfe9e4] bg-white shadow-[0_28px_50px_rgba(16,44,50,0.18)]"
          style={{ top: 'var(--nav-offset, 64px)' }}
        >
          <div className={width === 'narrow' ? 'mx-auto max-w-xl px-6 py-7' : 'mx-auto max-w-[1240px] px-6 py-7 lg:px-8'}>
            {typeof children === 'function' ? children({ close: dismiss }) : children}
          </div>
        </div>
      ) : null}
    </li>
  );
}
