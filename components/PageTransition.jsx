"use client";
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const containerRef = useRef(null);
  const hydratedOnceRef = useRef(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    // Avoid DOM mutations during initial hydration.
    if (!hydratedOnceRef.current) {
      hydratedOnceRef.current = true;
      return;
    }

    const tween = gsap.fromTo(
      node,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: 'sine.out',
        clearProps: 'opacity,transform'
      }
    );

    return () => tween.kill();
  }, [pathname]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
} 