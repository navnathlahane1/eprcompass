import React from "react";
import { whoIsItForContent } from "@/data/whoIsItForContent";

/**
 * Renders a full "Who Is It For" category page using data-driven content.
 * @param {Object} props
 * @param {string} categoryKey - Key in whoIsItForContent.js
 */
export default function WhoIsItForCategoryPage({ categoryKey }) {
  const content = whoIsItForContent[categoryKey];
  if (!content) return <div>Category not found.</div>;
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Hero Section */}
      <section className="py-12 px-4 md:px-12 lg:px-32 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{content.hero.title}</h1>
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-eco-green-5">{content.hero.subtitle}</h2>
          <p className="mb-4 text-base md:text-lg">{content.hero.description}</p>
          <div className="flex gap-2 mb-4">
            <button className="btn btn-primary">{content.hero.cta.primary}</button>
            <button className="btn btn-secondary">{content.hero.cta.secondary}</button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {content.hero.stats?.map((stat, i) => (
              <div key={i} className="bg-eco-green-1/30 dark:bg-eco-green-4/20 rounded p-2 text-center">
                <div className="font-bold text-lg">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        {content.hero.image && (
          <img src={content.hero.image} alt={content.hero.title} className="w-full max-w-xs rounded shadow-lg" />
        )}
      </section>
      {/* Features Section */}
      <section className="py-8 px-4 md:px-12 lg:px-32">
        <h3 className="text-2xl font-semibold mb-4">Key Features</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {content.features?.map((f, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded p-4 flex items-start gap-3">
              <span className="inline-block w-8 h-8 bg-eco-green-4/20 rounded-full flex items-center justify-center text-eco-green-5 font-bold">{f.icon}</span>
              <div>
                <div className="font-semibold">{f.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{f.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* Services Section */}
      <section className="py-8 px-4 md:px-12 lg:px-32">
        <h3 className="text-2xl font-semibold mb-4">Services</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {content.services?.map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded shadow p-4">
              <div className="font-bold mb-1">{s.title}</div>
              <div className="text-sm mb-2 text-gray-600 dark:text-gray-300">{s.description}</div>
              <ul className="list-disc ml-5 text-sm text-gray-700 dark:text-gray-300">
                {s.features?.map((f, j) => <li key={j}>{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
      {/* Testimonials Section */}
      {content.testimonials && (
        <section className="py-8 px-4 md:px-12 lg:px-32">
          <h3 className="text-2xl font-semibold mb-4">Testimonials</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {content.testimonials.map((t, i) => (
              <div key={i} className="bg-eco-green-1/30 dark:bg-eco-green-4/20 rounded p-4">
                <div className="font-semibold mb-1">{t.name} <span className="text-xs text-gray-500">({t.role})</span></div>
                <div className="text-sm mb-2">"{t.content}"</div>
              </div>
            ))}
          </div>
        </section>
      )}
      {/* CTA Section */}
      {content.cta && (
        <section className="py-8 px-4 md:px-12 lg:px-32 text-center">
          <h3 className="text-2xl font-bold mb-2">{content.cta.title}</h3>
          <p className="mb-4 text-lg">{content.cta.description}</p>
          <button className="btn btn-primary">{content.cta.button}</button>
        </section>
      )}
    </div>
  );
}
