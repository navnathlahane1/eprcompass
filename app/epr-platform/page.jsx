"use client";

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import HeroSection from '@/components/redefine-platform/HeroSection';
import TabbedInfoSection from '@/components/TabbedInfoSection';
import { Users, FileText, Shield, Handshake, Package, TrendingUp, CheckCircle, Calendar, PhoneCall } from 'lucide-react';
import useScrollReveal from '@/components/useScrollReveal';
import CallbackForm from '@/components/CallbackForm';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import { meetingRequestHref } from '@/lib/meetingRequest';

const tabbedInfoTabs = [
  {
    label: 'Overview',
    heading: 'EPR Platform Overview',
    description:
      'Access EPR registration, certificate procurement, annual returns and PRO partnerships under PWM Rules 2022. One place for Extended Producer Responsibility compliance.',
    features: [
      { icon: FileText, text: 'CPCB portal registration for producers, importers and brand owners' },
      { icon: Shield, text: 'EPR certificate procurement and annual return filing' },
      { icon: Package, text: 'Waste categories: plastic, e-waste, battery, tyre, oil' },
    ],
    image: '/imgs/Our_Company_Image.png',
  },
  {
    label: 'Who It’s For',
    heading: 'Producers, Recyclers & Compliance',
    description: 'Whether you are a producer, importer, brand owner, recycler, PRO or compliance stakeholder — we support your EPR journey.',
    features: [
      { icon: Users, text: 'Producers & Manufacturers: EPR registration and certificates' },
      { icon: Handshake, text: 'Recyclers & PROs: Registration and certificate issuance' },
      { icon: Shield, text: 'Government & Auditors: Guidelines and verification support' },
    ],
    image: '/imgs/Our_Culture_Image.png',
  },
  {
    label: 'Benefits',
    heading: 'Why Use the EPR Platform?',
    description: 'Achieve 100% EPR compliance with expert support, valid certificates and on-time annual returns.',
    features: [
      { icon: CheckCircle, text: '98% clients achieve compliance within 45 days' },
      { icon: TrendingUp, text: 'Cost-effective certificate procurement' },
      { icon: Shield, text: 'Pan-India coverage and CPCB portal expertise' },
    ],
    image: '/imgs/Our_Company_Image.png',
  },
];

export default function EPRPlatformPage() {
  const heroRef = useRef(null);
  const tabbedRef = useRef(null);
  const [showCallback, setShowCallback] = useState(false);
  const router = useRouter();

  useScrollReveal(heroRef);
  useScrollReveal(tabbedRef, { delay: 0.1 });

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <div ref={heroRef}>
        <HeroSection
          title="EPR Platform"
          subtitle="Your single platform for Extended Producer Responsibility — registration, certificate procurement, annual returns and PRO partnerships under PWM Rules 2022."
          primaryCta="Get EPR Support"
          secondaryCta="Request Callback"
          onConsultationClick={() => { trackEvent('Meeting Request Opened', { source: 'epr_platform_hero' }); router.push(meetingRequestHref('epr_platform_hero')); }}
          onCallbackClick={() => { trackEvent('Callback Modal Opened', { source: 'epr_platform_hero' }); setShowCallback(true); }}
        />
      </div>
      <div ref={tabbedRef}><TabbedInfoSection tabs={tabbedInfoTabs} /></div>
      <section className="w-full py-12 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 font-tangent">Quick Links</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Explore EPR services and find solutions for your role.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/services/extended-producer-responsibility" className="inline-flex items-center px-6 py-3 rounded-xl bg-eco-green-4 text-white font-medium hover:bg-eco-green-5 transition">
              EPR Services
            </Link>
            <Link href="/who-is-it-for" className="inline-flex items-center px-6 py-3 rounded-xl border-2 border-eco-green-4 text-eco-green-4 font-medium hover:bg-eco-green-4 hover:text-white transition">
              Who is EPR for?
            </Link>
            <Link href="/services" className="inline-flex items-center px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              All Services
            </Link>
          </div>
        </div>
      </section>
      <section className="w-full py-16 px-4 relative bg-eco-green-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0" aria-hidden>
          <svg width="100%" height="100%" className="w-full h-full" style={{ opacity: 0.18 }}>
            <defs>
              <pattern id="epr-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fff" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#epr-grid)" />
          </svg>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 font-tangent text-center">
            Ready to achieve EPR compliance?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto text-center">
            Get EPR registration, procure certificates and file annual returns. Our experts will guide you through PWM Rules 2022.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={meetingRequestHref('epr_platform_cta')}
              className="inline-flex items-center px-8 py-4 rounded-full bg-white text-eco-green-4 font-semibold text-lg shadow-lg hover:bg-gray-100 transition text-center"
              onClick={() => trackEvent('Meeting Request Opened', { source: 'epr_platform_cta' })}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Request a Meeting
            </Link>
            <button
              type="button"
              className="inline-flex items-center px-8 py-4 rounded-full border border-white text-white font-semibold text-lg hover:bg-white hover:text-eco-green-4 transition text-center"
              onClick={() => { trackEvent('Callback Modal Opened', { source: 'epr_platform_cta' }); setShowCallback(true); }}
            >
              <PhoneCall className="w-5 h-5 mr-2" />
              Request Callback
            </button>
          </div>
        </div>
        <CallbackForm open={showCallback} onClose={() => setShowCallback(false)} />
      </section>
    </main>
  );
}
