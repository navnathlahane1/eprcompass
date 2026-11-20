"use client";
import React from "react";

const stats = [
  {
    value: "98%",
    desc: "of clients achieve EPR compliance within 45 days with our support.",
    source: { label: "EPR Compliance Success", href: "#" },
    tag: "Compliance",
  },
  {
    value: "₹2.5 Cr+",
    desc: "saved in EPR compliance costs for clients annually.",
    source: { label: "Cost Optimization", href: "#" },
    tag: "Savings",
  },
  {
    value: "500+",
    desc: "EPR certificates procured with 100% validity.",
    source: { label: "Certificate Procurement", href: "#" },
    tag: "Certificates",
  },
];

export default function StatsBanner() {
  return (
    <section className="w-full bg-eco-green-4 py-16 px-4">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <div className="mb-8 text-center">
          <div className="text-lg md:text-xl font-medium text-white/90 mb-1">EPR Solutions that Drive</div>
          <div className="text-3xl md:text-5xl font-bold text-white font-tangent">Compliance for Every Producer</div>
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <div className="text-6xl md:text-7xl font-bold text-white mb-2 font-tangent">{stat.value}</div>
              <div className="text-lg md:text-xl text-white/90 mb-4 max-w-xs">{stat.desc}</div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-white/80 text-sm">
                  Source:&nbsp;
                  <a href={stat.source.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
                    {stat.source.label} <span aria-hidden>↗</span>
                  </a>
                </div>
                <span className="bg-white/20 text-white px-4 py-1 rounded-full text-xs font-medium mt-1">{stat.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 