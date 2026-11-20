'use client';

import { useParams, notFound } from 'next/navigation';
import { useRef } from 'react';
import {
  GraduationCap, BookOpen, Users, Award, Briefcase, TrendingUp, Shield, MessageCircle,
  Building2, Microscope, ArrowRight, CheckCircle, Star, XCircle, Package, RefreshCw, FileText,
} from 'lucide-react';
import { whoIsItForContent } from '@/data/whoIsItForContent';
import { whoIsItForLandingContent, TRUST_BADGES } from '@/data/whoIsItForLandingContent';
import useScrollReveal from '@/components/useScrollReveal';
import ContactEmail from '@/components/public-site/ContactEmail';

const scrollToContact = () => {
  const el = document.querySelector('[data-consultation-form]');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  else window.location.href = '/contact';
};
const scrollToCallback = () => {
  const el = document.querySelector('[data-callback-form]');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  else window.location.href = '/contact';
};

const AUDIENCE_TO_CONTENT = {
  'producers': { key: 'eprProducers', label: 'Producers & Manufacturers' },
  'brand-owners': { key: 'eprBrandOwners', label: 'Brand Owners & Importers' },
  'recyclers': { key: 'eprRecyclers', label: 'Recyclers & PROs' },
  'compliance': { key: 'eprCompliance', label: 'Government & Compliance' },
};

const ICON_MAP = {
  GraduationCap, BookOpen, Users, Award, Briefcase, TrendingUp, Shield, MessageCircle, Building2, Microscope, Package, RefreshCw, FileText,
};

const DEFAULT_HERO_STATS = [
  { value: "2,000+", label: "Companies Served" },
  { value: "100%", label: "Compliance Rate" },
  { value: "45 Days", label: "Avg Setup Time" },
  { value: "4.8/5", label: "Client Rating" },
];

export default function CategoryPage() {
  const params = useParams();
  const category = params?.category;
  const config = category ? AUDIENCE_TO_CONTENT[category] : null;
  if (!config) notFound();

  const content = whoIsItForContent[config.key];
  const landing = whoIsItForLandingContent[config.key];
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const servicesRef = useRef(null);
  const testimonialsRef = useRef(null);
  const ctaRef = useRef(null);
  const problemRef = useRef(null);
  const solutionRef = useRef(null);
  const pricingRef = useRef(null);
  const trustRef = useRef(null);

  useScrollReveal(heroRef);
  useScrollReveal(featuresRef, { delay: 0.1 });
  useScrollReveal(servicesRef, { delay: 0.2 });
  useScrollReveal(testimonialsRef, { delay: 0.1 });
  useScrollReveal(ctaRef, { delay: 0.2 });
  useScrollReveal(problemRef, { delay: 0.1 });
  useScrollReveal(solutionRef, { delay: 0.1 });
  useScrollReveal(pricingRef, { delay: 0.1 });
  useScrollReveal(trustRef, { delay: 0.1 });

  const IconComponent = config.key === 'eprProducers' ? Building2 : config.key === 'eprBrandOwners' ? Package : config.key === 'eprRecyclers' ? RefreshCw : Shield;
  const heroTitle = content.hero.title;
  const heroDescription = content.hero.description;
  const showConversionLayout = !!landing;
  const testimonialsList = (landing?.testimonialsExtra && landing.testimonialsExtra.length > 0)
    ? landing.testimonialsExtra.map((t) => ({ name: t.name, role: t.role, content: t.quote, image: null }))
    : content.testimonials;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">
      {/* Hero */}
      <section ref={heroRef} className="bg-gradient-to-br from-eco-green-1/10 to-eco-green-2/20 dark:from-gray-800 dark:to-gray-900 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-4 min-w-0 flex-wrap">
                <IconComponent size={24} className="text-eco-green-4 flex-shrink-0" />
                <span className="text-eco-green-4 font-medium break-words">{config.label}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6 break-words min-w-0">{heroTitle}</h1>
              {showConversionLayout && landing.heroSubtext ? (
                <>
                  <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6 break-words min-w-0">{landing.heroSubtext}</p>
                  {landing.heroBullets && landing.heroBullets.length > 0 && (
                    <ul className="space-y-2 mb-8">
                      {landing.heroBullets.map((bullet, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                          <CheckCircle size={20} className="text-eco-green-4 flex-shrink-0" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap gap-4">
                    <button onClick={scrollToContact} className="bg-eco-green-4 text-white px-8 py-3 rounded-lg font-medium hover:bg-eco-green-5 transition-colors">{landing.heroCtaPrimary || content.hero.cta.primary} →</button>
                    <button onClick={scrollToCallback} className="border-2 border-eco-green-4 text-eco-green-4 px-8 py-3 rounded-lg font-medium hover:bg-eco-green-4 hover:text-white transition-colors">{landing.heroCtaSecondary || content.hero.cta.secondary} →</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 break-words min-w-0">{heroDescription}</p>
                  <div className="flex flex-wrap gap-4">
                    <button onClick={scrollToContact} className="bg-eco-green-4 text-white px-8 py-3 rounded-lg font-medium hover:bg-eco-green-5 transition-colors">{content.hero.cta.primary}</button>
                    <button onClick={scrollToCallback} className="border-2 border-eco-green-4 text-eco-green-4 px-8 py-3 rounded-lg font-medium hover:bg-eco-green-4 hover:text-white transition-colors">{content.hero.cta.secondary}</button>
                  </div>
                </>
              )}
            </div>
            <div className="relative min-w-0">
              <div className="bg-gradient-to-br from-eco-green-4 to-eco-green-4 rounded-2xl p-8 text-white overflow-hidden">
                <div className="grid grid-cols-2 gap-6 min-w-0">
                  {(content.hero.stats || DEFAULT_HERO_STATS).map((stat, i) => (
                    <div key={i} className="text-center min-w-0 break-words">
                      <div className="text-3xl font-bold mb-2">{stat.value}</div>
                      <div className="text-white/90 text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem section – conversion layout only */}
      {showConversionLayout && landing.problem && (
        <section ref={problemRef} className="py-16 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 text-center min-w-0">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 break-words">The Problem</h2>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6 break-words">{landing.problem.heading}</h3>
            <ul className="space-y-3 mb-8 text-left max-w-2xl mx-auto min-w-0">
              {landing.problem.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-300 break-words min-w-0">
                  <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
            {landing.problem.tagline && <p className="text-lg font-medium text-gray-900 dark:text-white mb-6">{landing.problem.tagline}</p>}
            <button onClick={scrollToContact} className="bg-eco-green-4 text-white px-6 py-3 rounded-lg font-medium hover:bg-eco-green-5 transition-colors">{landing.problem.cta} →</button>
          </div>
        </section>
      )}

      {/* 5C Solution – conversion layout only */}
      {showConversionLayout && landing.solution5C && landing.solution5C.length > 0 && (
        <section ref={solutionRef} id="solution" className="py-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 min-w-0">
            <div className="text-center mb-16 min-w-0">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 break-words">The 5C Solution</h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto break-words">Our structured approach to full EPR compliance.</p>
            </div>
            <div className="space-y-16 min-w-0">
              {landing.solution5C.map((block, idx) => (
                <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-12 last:border-0 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 break-words">{block.title}</h3>
                  {(block.desc || block.subtitle) && <p className="text-gray-600 dark:text-gray-300 mb-4 break-words min-w-0">{block.desc || block.subtitle}</p>}
                  {block.items && block.items.length > 0 && (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 min-w-0">
                      {block.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-200 break-words min-w-0">
                          <CheckCircle size={18} className="text-eco-green-4 flex-shrink-0" />
                          <span className="min-w-0">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {block.meta && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{block.meta}</p>}
                  {block.tagline && <p className="text-gray-700 dark:text-gray-200 font-medium mb-4">{block.tagline}</p>}
                  <button onClick={scrollToContact} className="text-eco-green-4 font-medium hover:underline inline-flex items-center gap-1">{block.cta || 'Get Started'} <ArrowRight size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section ref={featuresRef} className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 min-w-0">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 break-words">What We Offer</h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto break-words">Comprehensive support designed for {config.label.toLowerCase()}.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {content.features.map((feature, index) => {
                const Icon = ICON_MAP[feature.icon];
                return (
                  <div key={index} className="text-center group min-w-0">
                    <div className="w-16 h-16 bg-eco-green-1/10 dark:bg-eco-green-4/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-eco-green-1/20 dark:group-hover:bg-eco-green-4/40 transition-colors flex-shrink-0">
                      {Icon && <Icon size={32} className="text-eco-green-4" />}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 break-words min-w-0">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 break-words min-w-0">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      {/* Services */}
      <section ref={servicesRef} id="services" className="bg-gray-50 dark:bg-gray-800 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 min-w-0">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 break-words">Our Services</h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto break-words">Services designed to support {config.label.toLowerCase()}.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {content.services.map((service, index) => (
                <div key={index} className="bg-white dark:bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow min-w-0 overflow-hidden">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 break-words min-w-0">{service.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 break-words min-w-0">{service.description}</p>
                  <ul className="space-y-3 min-w-0">
                    {service.features.map((f, i) => (
                      <li key={i} className="flex items-center text-gray-600 dark:text-gray-300 break-words min-w-0">
                        <CheckCircle size={16} className="text-eco-green-4 mr-3 flex-shrink-0" />
                        <span className="min-w-0">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

      {/* Testimonials / Success stories */}
      <section ref={testimonialsRef} className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 min-w-0">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 break-words">{showConversionLayout ? 'Success Stories' : 'What Our Clients Say'}</h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto break-words">Hear from those who have benefited from our programs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonialsList.map((t, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg min-w-0 overflow-hidden">
                <div className="flex items-center mb-6 min-w-0">
                  <div className="w-12 h-12 bg-eco-green-1/10 dark:bg-eco-green-4/20 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Users size={24} className="text-eco-green-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white break-words">{t.name}</h4>
                    <p className="text-gray-600 dark:text-gray-300 break-words">{t.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic break-words min-w-0">&ldquo;{t.content}&rdquo;</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing – conversion layout only */}
      {showConversionLayout && landing.pricingTiers && landing.pricingTiers.length > 0 && (
        <section ref={pricingRef} id="pricing" className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Pricing</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Choose the right plan for you.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto min-w-0">
              {landing.pricingTiers.map((tier, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl p-8 shadow-lg min-w-0 overflow-hidden ${tier.highlight ? 'bg-eco-green-4 text-white ring-2 ring-eco-green-4 md:scale-105' : 'bg-white dark:bg-gray-800 dark:text-gray-200'}`}
                >
                  <h3 className="text-xl font-bold mb-6 break-words">{tier.name}</h3>
                  <ul className="space-y-3 mb-8 min-w-0">
                    {tier.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 break-words min-w-0">
                        <CheckCircle size={18} className={`flex-shrink-0 mt-0.5 ${tier.highlight ? 'text-eco-green-1' : 'text-eco-green-4'}`} />
                        <span className="min-w-0">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={scrollToContact}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${tier.highlight ? 'bg-white text-eco-green-4 hover:bg-gray-100' : 'bg-eco-green-4 text-white hover:bg-eco-green-5'}`}
                  >
                    {tier.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust badges – conversion layout only */}
      {showConversionLayout && TRUST_BADGES.length > 0 && (
        <section ref={trustRef} className="py-12 bg-gray-100 dark:bg-gray-800">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-center">
              {TRUST_BADGES.map((badge, i) => (
                <span key={i} className="text-gray-600 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
                  <CheckCircle size={18} className="text-eco-green-4 flex-shrink-0" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section ref={ctaRef} className="bg-gradient-to-r from-eco-green-4 to-eco-green-4 py-20 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center px-6 min-w-0">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 break-words">{showConversionLayout && landing.finalCta ? landing.finalCta.heading : content.cta.title}</h2>
          <p className="text-lg sm:text-xl text-white/80 mb-8 break-words min-w-0">
            {showConversionLayout && landing.finalCta?.subheading ? landing.finalCta.subheading : content.cta.description}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={scrollToContact} className="bg-white text-eco-green-4 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              {showConversionLayout && landing.finalCta?.primaryCta ? landing.finalCta.primaryCta : content.cta.button}
            </button>
            <button onClick={scrollToCallback} className="border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-eco-green-4 transition-colors">
              {showConversionLayout && landing.finalCta?.secondaryCta ? landing.finalCta.secondaryCta : 'View Training Programs'}
            </button>
          </div>
          {showConversionLayout && landing.finalCta?.contact && (
            <p className="mt-8 text-white/90 text-sm">{landing.finalCta.contact} <ContactEmail className="font-semibold underline underline-offset-2" /></p>
          )}
        </div>
      </section>
    </div>
  );
}
