"use client";
import { useState } from "react";
import Button from "@/components/Button";
import CallbackForm from "@/components/CallbackForm";
import { meetingRequestHref } from "@/lib/meetingRequest";

const ServiceHeroSection = ({ title, subtitle, badge, buttons = [] }) => {
  const [showCallback, setShowCallback] = useState(false);

  const handleButtonClick = (idx, btn) => {
    if (idx === 1) setShowCallback(true);
    else if (btn.onClick) btn.onClick();
  };

  return (
    <section className="w-full py-20 px-4 bg-gradient-to-b from-eco-green-1/20 to-white dark:from-gray-950 dark:to-gray-900 text-center transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {badge && (
          <div className="mb-5">
            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
              {badge}
            </span>
          </div>
        )}
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white font-tangent">
          {title}
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-10">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-4">
          {buttons.map((btn, idx) => {
            const destination = idx === 0 && (!btn.href || btn.href === "#" || btn.href === "/contact")
              ? meetingRequestHref("service_hero")
              : btn.href && btn.href !== "#" ? btn.href : null;

            return destination ? (
              <Button key={idx} href={destination} icon={btn.icon} variant={btn.variant || "primary"} className={btn.className || "min-w-[270px] text-lg px-8 py-4"}>
                {btn.label}
              </Button>
            ) : (
              <Button
                key={idx}
                icon={btn.icon}
                variant={btn.variant || "primary"}
                className={btn.className || "min-w-[270px] text-lg px-8 py-4"}
                onClick={() => handleButtonClick(idx, btn)}
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
};

export default ServiceHeroSection; 
