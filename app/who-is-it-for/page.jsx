'use client';

import { useState } from 'react';
import Link from 'next/link';
import ConsultationTriggerButton from '@/components/ConsultationTriggerButton';
import { 
  Building2, 
  Package, 
  RefreshCw, 
  Shield, 
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';

const targetAudiences = [
  {
    id: 'producers',
    title: 'Producers & Manufacturers',
    icon: Building2,
    description: 'EPR registration, certificate procurement and annual returns for plastic packaging, e-waste, battery, tyre, used oil, ELV, construction & demolition and non-ferrous materials under applicable EPR rules.',
    features: ['EPR Registration', 'Certificate Procurement', 'Annual Returns', 'Target Management'],
    href: '/who-is-it-for/producers/',
    color: 'from-eco-green-4 to-eco-green-5'
  },
  {
    id: 'brand-owners',
    title: 'Brand Owners & Importers',
    icon: Package,
    description: 'Fulfill Extended Producer Responsibility for e-commerce, retail and import/export. CPCB compliance and PRO partnerships.',
    features: ['Plastic Packaging EPR', 'Importer EPR', 'Annual Returns', 'Cost Optimization'],
    href: '/who-is-it-for/brand-owners/',
    color: 'from-eco-green-4 to-eco-green-5'
  },
  {
    id: 'recyclers',
    title: 'Recyclers & PROs',
    icon: RefreshCw,
    description: 'Access a dedicated recycler portal with AI-matched tender alerts, live auction rooms, real-time CPCB regulatory alerts, and direct corporate negotiation.',
    features: ['AI Tender Matching', 'Live Auction Bidding', 'CPCB Alert Feed', 'Corporate Negotiations'],
    href: '/who-is-it-for/recyclers/',
    color: 'from-eco-green-4 to-eco-green-5'
  },
  {
    id: 'compliance',
    title: 'Government & Compliance',
    icon: Shield,
    description: 'Resources for SPCBs, CPCB, auditors and consultants. EPR guidelines, verification support and training.',
    features: ['EPR Guidelines', 'Compliance Verification', 'Reporting Frameworks', 'Stakeholder Support'],
    href: '/who-is-it-for/compliance/',
    color: 'from-eco-green-4 to-eco-green-5'
  }
];

export default function WhoIsItForPage() {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-eco-green-1 to-eco-green-2 dark:from-gray-800 dark:to-gray-900 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 min-w-0">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 break-words">
              Who is EPR for?
            </h1>
            <p className="text-lg sm:text-xl text-gray-800 dark:text-gray-100 mb-8 max-w-3xl mx-auto break-words">
              Extended Producer Responsibility (EPR) applies to producers, importers, brand owners, recyclers and compliance stakeholders. Find solutions tailored to your role.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="#audiences" 
                className="bg-eco-green-4 text-white px-8 py-3 rounded-lg font-medium hover:bg-eco-green-5 transition-colors"
              >
                Explore Solutions
              </Link>
              <Link 
                href="/contact" 
                className="border-2 border-eco-green-5 text-eco-green-5 px-8 py-3 rounded-lg font-medium bg-white/70 hover:bg-eco-green-5 hover:text-white dark:border-eco-green-3 dark:text-eco-green-3 dark:bg-transparent dark:hover:bg-eco-green-3 dark:hover:text-gray-900 transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audiences Grid */}
      <section id="audiences" className="py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 min-w-0">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 break-words">
              Choose Your Path
            </h2>
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-200 max-w-2xl mx-auto break-words">
              Select your role or organization type to discover tailored solutions designed specifically for your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {targetAudiences.map((audience) => {
              const IconComponent = audience.icon;
              return (
                <Link
                  key={audience.id}
                  href={audience.href}
                  className="group min-w-0"
                  onMouseEnter={() => setHoveredCard(audience.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700 h-full flex flex-col overflow-hidden min-w-0">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${audience.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                      <IconComponent size={32} className="text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-eco-green-4 transition-colors break-words min-w-0">
                      {audience.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-700 dark:text-gray-200 mb-6 leading-relaxed break-words min-w-0 overflow-hidden">
                      {audience.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2 mb-6 min-w-0">
                      {audience.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-700 dark:text-gray-200 break-words min-w-0">
                          <CheckCircle size={16} className="text-eco-green-4 mr-2 flex-shrink-0" />
                          <span className="min-w-0">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div className="flex items-center text-eco-green-4 font-medium group-hover:text-eco-green-5 transition-colors">
                      <span>Learn More</span>
                      <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-white dark:bg-gray-800 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 min-w-0">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 break-words">
              Why Choose EPR Compass?
            </h2>
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-200 max-w-2xl mx-auto break-words">
              We understand EPR compliance under PWM Rules 2022 and support producers, recyclers and compliance stakeholders across India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center min-w-0 break-words">
              <div className="w-16 h-16 bg-eco-green-4/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star size={32} className="text-eco-green-4" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                EPR & PWM Expertise
              </h3>
              <p className="text-gray-700 dark:text-gray-200 break-words">
                Deep understanding of PWM Rules 2022, CPCB portal and EPR compliance for all waste categories.
              </p>
            </div>

            <div className="text-center min-w-0 break-words">
              <div className="w-16 h-16 bg-eco-green-4/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-eco-green-4" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Proven Compliance
              </h3>
              <p className="text-gray-700 dark:text-gray-200 break-words">
                98% of clients achieve EPR compliance within 45 days. 500+ certificates procured with 100% validity.
              </p>
            </div>

            <div className="text-center min-w-0 break-words">
              <div className="w-16 h-16 bg-eco-green-4/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield size={32} className="text-eco-green-4" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                End-to-End Support
              </h3>
              <p className="text-gray-700 dark:text-gray-200 break-words">
                From registration to annual returns — dedicated support for producers, recyclers and brand owners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-eco-green-4 to-eco-green-5 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 pointer-events-none" aria-hidden />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 min-w-0 [text-shadow:0_1px_2px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.2)]">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 break-words">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl text-white mb-8 break-words">
            Choose your path and achieve EPR compliance with confidence.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <ConsultationTriggerButton
              label="Contact us"
              source="who_is_it_for_cta"
              className="bg-white text-eco-green-4 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            />
            <Link 
              href="#audiences" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-eco-green-4 transition-colors"
            >
              Explore Solutions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

