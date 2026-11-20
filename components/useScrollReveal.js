// "use client";
// import { useEffect } from 'react';
// import gsap from 'gsap';
// import { ScrollTrigger } from 'gsap/ScrollTrigger';
// gsap.registerPlugin(ScrollTrigger);

// export default function useScrollReveal(ref, options = {}) {
//   useEffect(() => {
//     if (!ref.current) return;
//     const el = ref.current;
//     const anim = gsap.fromTo(
//       el,
//       { opacity: 0, x: options.xStart ?? -40 },
//       {
//         opacity: 1,
//         x: 0,
//         duration: options.duration || 1.2,
//         ease: options.ease || 'sine.out',
//         scrollTrigger: {
//           trigger: el,
//           start: 'top 85%',
//           toggleActions: 'play none none none',
//           once: true,
//         },
//       }
//     );
//     return () => {
//       if (anim.scrollTrigger) anim.scrollTrigger.kill();
//       anim.kill();
//     };
//   }, [ref, options]);
// } 

"use client";

import { useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';

export default function useScrollReveal(ref, options = {}) {
  useLayoutEffect(() => {
    // Ensure the ref is defined and has a current value (the DOM element exists)
    if (!ref || typeof ref !== 'object' || !('current' in ref) || !ref.current) {
      return;
    }

    // Import and register ScrollTrigger ONLY inside this effect.
    // This prevents it from being evaluated on the server.
    // We use dynamic import (require) here because `import` statements at the top
    // of a module are evaluated immediately, even with "use client".
    const { ScrollTrigger } = require('gsap/ScrollTrigger');
    gsap.registerPlugin(ScrollTrigger);

    const el = ref.current;

    // Create a GSAP context for better cleanup, especially in React Strict Mode
    let ctx = gsap.context(() => {
      const anim = gsap.fromTo(
        el,
        { opacity: 0, x: options.xStart ?? -40 },
        {
          opacity: 1,
          x: 0,
          duration: options.duration || 1.2,
          ease: options.ease || 'sine.out',
          scrollTrigger: {
            trigger: el,
            start: options.start || 'top 85%', // Make start customizable
            toggleActions: 'play none none none',
            once: true,
            // Optionally, add markers for debugging during development
            // markers: process.env.NODE_ENV === 'development',
          },
        }
      );
    }, el); // Scope the context to the element to animate, or a common parent.

    // Cleanup function: revert the GSAP context when the component unmounts
    return () => {
      ctx.revert(); // This will kill all tweens and ScrollTriggers created in this context
    };
  }, [ref, options]); // Dependencies: Re-run effect if ref or options change
}