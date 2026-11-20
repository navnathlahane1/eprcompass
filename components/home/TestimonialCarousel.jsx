"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Rajesh Mehta",
    role: "MD, PackRight Industries",
    category: "Plastic Waste",
    rating: 5,
    text: "EPR Compass made our plastic waste compliance completely hassle-free. From registration to annual filing, their team handled everything. We saved over ₹3 Lakhs in potential penalties.",
    result: "100% compliance in 45 days",
  },
  {
    name: "Priya Sharma",
    role: "Compliance Head, TechVista Electronics",
    category: "E-Waste",
    rating: 5,
    text: "Managing e-waste EPR across 3 product lines was overwhelming until we found EPR Compass. Their consultants understood our specific needs and delivered a tailored compliance roadmap.",
    result: "3 EPR registrations completed",
  },
  {
    name: "Anil Reddy",
    role: "CEPC Partner, Hyderabad",
    category: "CEPC Program",
    rating: 5,
    text: "The CEPC certification transformed my career. Within 3 months of certification, I onboarded 8 clients and crossed ₹1.5L monthly income. The training quality and lead support are exceptional.",
    result: "₹1.5L+ monthly earnings",
  },
  {
    name: "Sunita Patel",
    role: "Director, GreenAuto Parts Ltd",
    category: "ELV / Battery",
    rating: 5,
    text: "We needed battery waste and ELV compliance urgently before audit. EPR Compass's team delivered both registrations in record time with complete documentation. Truly reliable partners.",
    result: "Audit-ready in 30 days",
  },
  {
    name: "Vikram Joshi",
    role: "CEO, FreshPack FMCG",
    category: "Plastic Waste",
    rating: 5,
    text: "As a mid-size FMCG company, EPR costs were eating into our margins. The team optimized our certificate procurement strategy and reduced our compliance cost by 40%.",
    result: "40% cost reduction",
  },
  {
    name: "Dr. Meera Nair",
    role: "Environmental Consultant, Chennai",
    category: "CEPC Program",
    rating: 5,
    text: "The CEPC program gave me a structured framework to serve my existing environmental consulting clients better. The waste category depth and practical case studies set this apart from other certifications.",
    result: "Doubled client portfolio",
  },
];

export default function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % TESTIMONIALS.length);
  }, []);

  const prev = () => {
    setCurrent((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, next]);

  const t = TESTIMONIALS[current];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/95 dark:to-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="bg-eco-green-4/10 text-eco-green-4 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full">
            Success Stories
          </span>
          <h2 className="font-tricks text-3xl md:text-4xl font-bold mt-4 mb-3 text-gray-900 dark:text-white">
            What Our Clients Say
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Trusted by 2,000+ companies and 500+ CEPC partners across India.
          </p>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 md:p-10 text-center">
            <Quote size={32} className="mx-auto mb-4 text-eco-green-4/30" />
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 leading-relaxed mb-6 max-w-2xl mx-auto">
              &ldquo;{t.text}&rdquo;
            </p>
            <div className="flex items-center justify-center gap-0.5 mb-4">
              {Array.from({ length: t.rating }, (_, i) => (
                <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <div className="mb-3">
              <p className="font-bold text-gray-900 dark:text-white">{t.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.role}</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-eco-green-4/10 text-eco-green-4 px-3 py-1 rounded-full">
                {t.category}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full">
                {t.result}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-1.5">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === current ? "bg-eco-green-4 w-6" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Next testimonial"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

