import React from "react";
import { serviceContent } from "@/data/serviceContent";
import ServiceHero from "./ServiceHero";
import ValueGrid from "../ValueGrid";
import BannerCTA from "../BannerCTA";

/**
 * Renders a full service page for a given service key using data-driven content.
 * @param {Object} props
 * @param {string} props.serviceKey - Key in serviceContent.js
 */
export default function ServicePage({ serviceKey }) {
  const content = serviceContent[serviceKey];
  if (!content) return <div>Service not found.</div>;
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <ServiceHero {...content.hero} />
      {content.subFeatures && (
        <ValueGrid
          heading={content.subFeatures.title}
          subheading={content.subFeatures.subtitle}
          items={content.subFeatures.features}
        />
      )}
      {content.cardGrid && (
        <ValueGrid
          heading={content.cardGrid.heading}
          subheading={content.cardGrid.subheading}
          items={content.cardGrid.items}
        />
      )}
      {content.bannerCTA && <BannerCTA {...content.bannerCTA} />}
    </div>
  );
}
