'use client';

import { useEffect, useRef, useState } from 'react';

function parseStat(display) {
  const match = String(display).match(/^([^0-9]*)([0-9][0-9,]*)(\+)?(.*)$/);
  if (!match) return { prefix: '', end: 0, plus: false, suffix: display };
  return {
    prefix: match[1] || '',
    end: Number(match[2].replace(/,/g, '')),
    plus: Boolean(match[3]),
    suffix: match[4] || '',
  };
}

function format(n) {
  return n.toLocaleString('en-IN');
}

export default function CountUp({ value, className = '' }) {
  const parsed = parseStat(value);
  const ref = useRef(null);
  const [n, setN] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(parsed.end);
      setReady(true);
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setReady(true);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [parsed.end]);

  useEffect(() => {
    if (!ready) return undefined;
    if (/[A-Za-z]/.test(parsed.suffix)) {
      setN(parsed.end);
      return undefined;
    }
    const start = performance.now();
    const dur = 900;
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - (1 - t) ** 3;
      setN(Math.round(parsed.end * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, parsed.end, parsed.suffix]);

  return (
    <p ref={ref} className={className}>
      {parsed.prefix}{format(n)}{parsed.plus ? '+' : ''}{parsed.suffix}
    </p>
  );
}
