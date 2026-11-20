"use client";
import { useState } from "react";
import Button from "./Button";
import CallbackForm from "./CallbackForm";
import { meetingRequestHref } from "@/lib/meetingRequest";

export default function BannerCTA({ heading, subheading, buttons = [], badge }) {
  const [showCallback, setShowCallback] = useState(false);

  const handleButtonClick = (idx) => {
    if (idx === 1) setShowCallback(true);
  };

  return (
    <section className="w-full py-16 px-4 bg-eco-green-4 relative overflow-hidden">
      {/* Dark scrim for text contrast */}
      <div className="absolute inset-0 bg-black/15 pointer-events-none z-0" aria-hidden />
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden>
        <svg width="100%" height="100%" className="w-full h-full" style={{ opacity: 0.1 }}>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fff" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center [text-shadow:0_1px_2px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.2)]">
        {badge && (
          <span className="inline-block bg-yellow-400 text-gray-900 text-sm font-bold px-4 py-1.5 rounded-full mb-4 [text-shadow:none]">
            {badge}
          </span>
        )}
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 font-tangent">
          {heading}
        </h2>
        {subheading && (
          <p className="text-white text-lg mb-8 max-w-2xl mx-auto">
            {subheading}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {buttons.map((btn, idx) => {
            // If button has a real href (not "#"), render as a direct link
            if (btn.href && btn.href !== "#") {
              return (
                <Button key={idx} href={idx === 0 && btn.href === "/contact" ? meetingRequestHref("service_banner") : btn.href} variant="cta">{btn.label}</Button>
              );
            }
            // Route the primary request CTA to the shared meeting form.
            if (idx === 0) {
              return (
                <Button key={idx} href={meetingRequestHref("service_banner")} variant="cta">{btn.label}</Button>
              );
            }
            // Keep callback requests in their existing flow.
            return (
              <Button
                key={idx}
                variant="cta"
                onClick={() => handleButtonClick(idx)}
              >
                {btn.label}
              </Button>
            );
          })}
        </div>
      </div>
      <CallbackForm open={showCallback} onClose={() => setShowCallback(false)} />
    </section>
  );
} 
