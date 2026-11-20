"use client";

import { useState, useEffect } from "react";

function getTimeLeft(target) {
  const total = new Date(target).getTime() - Date.now();
  if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

function TimeBlock({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl md:text-3xl font-bold tabular-nums leading-none">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-wider mt-1 opacity-70">{label}</span>
    </div>
  );
}

export default function CountdownTimer({ targetDate, label = "Offer ends in", className = "", variant = "default" }) {
  const [timeLeft, setTimeLeft] = useState({ total: 1, days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeLeft(targetDate));
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted || timeLeft.total <= 0) return null;

  const baseClasses =
    variant === "banner"
      ? "bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl px-6 py-4"
      : "bg-gray-900 dark:bg-gray-800 text-white rounded-xl px-6 py-4 border border-gray-700";

  return (
    <div className={`${baseClasses} ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3 opacity-80 text-center">{label}</p>
      <div className="flex items-center justify-center gap-4">
        <TimeBlock value={timeLeft.days} label="Days" />
        <span className="text-xl font-light opacity-40">:</span>
        <TimeBlock value={timeLeft.hours} label="Hrs" />
        <span className="text-xl font-light opacity-40">:</span>
        <TimeBlock value={timeLeft.minutes} label="Min" />
        <span className="text-xl font-light opacity-40">:</span>
        <TimeBlock value={timeLeft.seconds} label="Sec" />
      </div>
    </div>
  );
}
