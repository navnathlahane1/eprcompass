"use client";
import React from "react";
import Button from "../Button";
import Link from "next/link";

export default function HomeLearnMore() {
  return (
    <section className="w-full flex flex-col md:flex-row items-center justify-between gap-8 px-4 py-12 md:py-20 max-w-7xl mx-auto overflow-x-hidden">
      {/* Left: Text */}
      <div className="flex-1 w-full max-w-xl min-w-0">
        <h2 className="text-3xl md:text-4xl font-bold text-eco-green-4 mb-4 font-tangent">
          EPR Compliance & Plastic Waste Management Made Simple
        </h2>
        <p className="mb-8 text-gray-700 dark:text-gray-300 text-base md:text-lg">
          We help producers, importers and brand owners stay compliant with PWM Rules 2022 — from EPR registration and certificate procurement to annual returns and recycler partnerships.
        </p>
        <Link href="/about-us" className="inline-block">
          <Button className="mt-2" variant="primary">
            Learn More About Us
          </Button>
        </Link>
      </div>
      {/* Right: Image with shadow/angle */}
      <div className="flex-1 w-full flex items-center justify-center relative max-w-xl min-w-0">
        {/* Angled shadow background shifted left */}
        <div className="hidden md:block absolute -left-10 top-10 w-full h-full bg-eco-green-1/10 dark:bg-eco-green-3/30 rounded-[2.5rem] rotate-3 z-0" />
        <img
          src="https://images.pexels.com/photos/2679814/pexels-photo-2679814.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
          alt="EPR compliance and plastic waste management"
          className="relative z-10 w-full max-w-xl h-[350px] sm:h-[420px] md:h-[500px] rounded-3xl border-4 border-eco-green-4 shadow-xl object-cover"
        />
      </div>
    </section>
  );
} 