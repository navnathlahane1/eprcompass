'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Scroll-triggered fade/slide using transform + opacity only.
 * Honors prefers-reduced-motion via the global CSS reset.
 */
export default function Reveal({ children, className = '', delay = 0, as: Tag = 'div' }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 420ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 420ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        willChange: shown ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  );
}
