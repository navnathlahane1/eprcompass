"use client";
import React, { useState, useEffect, useRef } from "react";
import Button from "./Button";
import { Calendar, PhoneCall, ArrowLeft, ArrowRight } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp/cta";
import { useRouter } from "next/navigation";
import { meetingRequestHref } from "@/lib/meetingRequest";
import { trackEvent } from "@/lib/analytics";

const slides = [
  {
    title: "EPR Compliance Made Simple — From Registration to Annual Returns",
    desc: "Complete Extended Producer Responsibility solutions for manufacturers, importers, and brand owners. Stay compliant with PWM Rules 2022.",
    bg: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1260&h=750&fit=crop"
  },
  {
    title: "Your Complete EPR Compass Compliance Partner",
    desc: "Expert EPR registration, certificate procurement, and plastic waste management support across all categories.",
    bg: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1260&h=750&fit=crop"
  },
  {
    title: "Navigate EPR Regulations with Confidence",
    desc: "End-to-end EPR compliance solutions — Registration, targets, certificates, and annual returns, all handled expertly.",
    bg: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=1260&h=750&fit=crop"
  },
  {
    title: "Achieve Your EPR Targets — Avoid Penalties",
    desc: "Procure valid EPR certificates, file annual returns on time, and partner with certified recyclers and PROs.",
    bg: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1260&h=750&fit=crop"
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [fade, setFade] = useState(false);
  const timeoutRef = useRef();
  const router = useRouter();

  const prev = () => {
    setFade(true);
    setTimeout(() => {
      setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1));
      setFade(false);
    }, 400);
  };
  const next = () => {
    setFade(true);
    setTimeout(() => {
      setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1));
      setFade(false);
    }, 400);
  };

  // Autoplay
  useEffect(() => {
    if (isHovered) return;
    timeoutRef.current = setTimeout(() => {
      setFade(true);
      setTimeout(() => {
        setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1));
        setFade(false);
      }, 400);
    }, 3000);
    return () => clearTimeout(timeoutRef.current);
  }, [current, isHovered]);

  return (
    <section
      className="relative w-full min-h-[400px] flex items-center justify-center overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url('${slides[current].bg}')` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 z-0" />
      {/* Content with fade effect */}
      <div className={`relative z-10 max-w-4xl mx-auto px-4 py-16 text-center flex flex-col items-center transition-opacity duration-500 ${fade ? 'opacity-0' : 'opacity-100'}`}>
        <div className="h-2 w-24 bg-eco-green-4 mb-6 rounded" />
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight font-tangent">
          {slides[current].title}
        </h1>
        <p className="text-lg md:text-2xl text-white/90 mb-8 max-w-2xl">
          {slides[current].desc}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button icon={Calendar} variant="primary" onClick={() => { trackEvent("Meeting Request Opened", { source: "home_hero" }); router.push(meetingRequestHref("home_hero")); }}>
            Request a Meeting
          </Button>
          <Button icon={PhoneCall} variant="secondary" onClick={() => window.open(whatsappUrl('Hi, please call me back about EPR compliance.'), '_blank', 'noopener,noreferrer')}>
            Request a Callback
          </Button>
        </div>
      </div>
      {/* Arrows */}
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 z-20 transition"
        onClick={prev}
        aria-label="Previous slide"
      >
        <ArrowLeft size={32} />
      </button>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 z-20 transition"
        onClick={next}
        aria-label="Next slide"
      >
        <ArrowRight size={32} />
      </button>
    </section>
  );
} 
