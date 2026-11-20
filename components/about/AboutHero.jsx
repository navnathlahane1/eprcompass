import React from "react";
import { Leaf, CheckCircle2 } from "lucide-react";

export default function AboutHero() {
  return (
    <section className="w-full bg-gradient-to-b from-eco-green-4/10 to-transparent py-16 px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 font-tangent text-gray-900 dark:text-white">
          Your EPR Compliance Partner
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
          At EPR Compass, we help producers, importers and brand owners achieve Extended Producer Responsibility compliance under PWM Rules 2022 — from registration and certificate procurement to annual returns and PRO partnerships.
        </p>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Mission Card */}
        <div className="relative bg-white dark:bg-black rounded-2xl shadow-lg p-8 flex flex-col items-start min-h-[280px] overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-eco-green-1/10 dark:bg-eco-green-3/10 rounded-bl-full -z-0" />
          <div className="flex items-center gap-2 mb-2 z-10">
            <Leaf size={28} className="text-eco-green-4" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Our Mission</span>
          </div>
          <p className="mb-4 text-gray-700 dark:text-gray-300 z-10">
            Guiding producers, importers and brand owners toward full EPR compliance through CPCB registration, certificate procurement and annual return filing — so you meet PWM Rules 2022 and avoid penalties.
          </p>
          <ul className="space-y-2 z-10">
            <li className="flex items-center gap-2 text-gray-900 dark:text-white"><CheckCircle2 size={20} className="text-eco-green-4" /> EPR registration and compliance excellence</li>
            <li className="flex items-center gap-2 text-gray-900 dark:text-white"><CheckCircle2 size={20} className="text-eco-green-4" /> Valid EPR certificate procurement</li>
            <li className="flex items-center gap-2 text-gray-900 dark:text-white"><CheckCircle2 size={20} className="text-eco-green-4" /> Annual returns and PRO partnerships</li>
          </ul>
        </div>
        {/* Vision Card */}
        <div className="relative bg-white dark:bg-black rounded-2xl shadow-lg p-8 flex flex-col items-start min-h-[280px] overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-eco-green-1/10 dark:bg-eco-green-3/10 rounded-bl-full -z-0" />
          <div className="flex items-center gap-2 mb-2 z-10">
            <Leaf size={28} className="text-eco-green-4" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Our Vision</span>
          </div>
          <p className="mb-4 text-gray-700 dark:text-gray-300 z-10">
            Creating an ecosystem where every producer and brand owner meets Extended Producer Responsibility with ease — through transparent compliance, valid certificates and a circular economy for plastic and regulated waste.
          </p>
          <ul className="space-y-2 z-10">
            <li className="flex items-center gap-2 text-gray-900 dark:text-white"><CheckCircle2 size={20} className="text-eco-green-4" /> EPR compliance leadership</li>
            <li className="flex items-center gap-2 text-gray-900 dark:text-white"><CheckCircle2 size={20} className="text-eco-green-4" /> 100% compliance assurance</li>
            <li className="flex items-center gap-2 text-gray-900 dark:text-white"><CheckCircle2 size={20} className="text-eco-green-4" /> Pan-India coverage</li>
          </ul>
        </div>
      </div>
    </section>
  );
} 
