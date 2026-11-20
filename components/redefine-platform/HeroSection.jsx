"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { Calendar, Phone, Users } from "lucide-react";
import Link from "next/link";

const BUBBLE_COUNT = 36;
const SHAPES = ["circle", "rect"];
const COLORS = [
  "rgba(16,185,129,0.12)",
  "rgba(16,185,129,0.18)",
  "rgba(16,185,129,0.25)",
  "rgba(16,185,129,0.10)"
];

// Use a deterministic PRNG so SSR and hydration produce identical attributes.
function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function seededRandom() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const seededRandom = createSeededRandom(20260418);

function randomBetween(min, max, randomFn = Math.random) {
  return randomFn() * (max - min) + min;
}

const bubblesInit = Array.from({ length: BUBBLE_COUNT }).map(() => ({
  shape: SHAPES[Math.floor(seededRandom() * SHAPES.length)],
  size: randomBetween(60, 180, seededRandom),
  top: randomBetween(0, 100, seededRandom), // percent, full height
  left: randomBetween(0, 100, seededRandom), // percent, full width
  color: COLORS[Math.floor(seededRandom() * COLORS.length)],
  opacity: randomBetween(0.15, 0.35, seededRandom),
  borderRadius: randomBetween(30, 50, seededRandom), // for rects
  aspect: randomBetween(0.6, 1.2, seededRandom),
}));

const HeroSection = ({ onConsultationClick, onCallbackClick, title = "EPR Platform", subtitle = "A dedicated space for producers, recyclers and brand owners to access EPR resources and services — compliance, certificate procurement, training and support — all in one place.", primaryCta = "Explore Services", secondaryCta = "Learn More" }) => {
  const bubbleRefs = useRef([]);
  const containerRef = useRef(null);

  // Store the section's width/height for full-range movement
  const sectionSize = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const updateSectionSize = () => {
      if (containerRef.current) {
        sectionSize.current = {
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        };
      }
    };
    updateSectionSize();
    window.addEventListener('resize', updateSectionSize);
    return () => window.removeEventListener('resize', updateSectionSize);
  }, []);

  useEffect(() => {
    // Initial large floating animation
    bubbleRefs.current.forEach((bubble, i) => {
      if (!bubble) return;
      const float = () => {
        const { width, height } = sectionSize.current;
        gsap.to(bubble, {
          x: randomBetween(-width * 0.4, width * 0.4),
          y: randomBetween(-height * 0.4, height * 0.4),
          duration: randomBetween(6, 12),
          ease: "sine.inOut",
          onComplete: float,
        });
      };
      float();
    });

    // On mouse move, burst all bubbles to new random positions across the section
    const handleMouseMove = () => {
      const { width, height } = sectionSize.current;
      bubbleRefs.current.forEach((bubble) => {
        if (!bubble) return;
        gsap.to(bubble, {
          x: randomBetween(-width * 0.45, width * 0.45),
          y: randomBetween(-height * 0.45, height * 0.45),
          duration: 0.35,
          ease: "power2.out",
          onComplete: () => {
            // Return to large float
            gsap.to(bubble, {
              x: randomBetween(-width * 0.4, width * 0.4),
              y: randomBetween(-height * 0.4, height * 0.4),
              duration: randomBetween(6, 12),
              ease: "sine.inOut",
            });
          },
        });
      });
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
    }
    return () => {
      if (container) container.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-gray-900 via-gray-950 to-gray-900"
      style={{ isolation: "isolate" }}
    >
      {/* Bubbles background */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        {bubblesInit.map((bubble, i) => (
          <div
            key={i}
            ref={el => (bubbleRefs.current[i] = el)}
            style={{
              position: "absolute",
              top: `${bubble.top}%`,
              left: `${bubble.left}%`,
              width: bubble.size,
              height: bubble.size * (bubble.shape === "rect" ? bubble.aspect : 1),
              background: bubble.color,
              opacity: bubble.opacity,
              borderRadius: bubble.shape === "circle" ? "50%" : `${bubble.borderRadius}%`,
              transition: "background 0.3s",
              filter: "blur(0.5px)",
            }}
          />
        ))}
      </div>
      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center py-24">
        <span className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-eco-green-4/10 mb-6">
          <Users className="w-12 h-12 text-eco-green-4" />
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold text-eco-green-4 font-tangent text-center mb-2">{title}</h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-10 text-center max-w-3xl">{subtitle}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            type="button"
            className="inline-flex items-center px-8 py-4 rounded-full bg-eco-green-4 text-white font-semibold text-lg shadow-lg hover:bg-eco-green-5 transition"
            onClick={onConsultationClick}
          >
            <Calendar className="w-5 h-5 mr-2" />
            {primaryCta}
            <span className="ml-2">→</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center px-8 py-4 rounded-full border border-eco-green-4 text-eco-green-4 font-semibold text-lg hover:bg-eco-green-4 hover:text-white transition"
            onClick={onCallbackClick}
          >
            <Phone className="w-5 h-5 mr-2" />
            {secondaryCta}
          </button>
        </div>
        <div className="flex justify-center">
          <span className="animate-bounce text-eco-green-4 text-3xl">↓</span>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
