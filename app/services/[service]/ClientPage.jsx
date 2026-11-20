'use client';

import { useRef, useState } from 'react';
import { serviceContent } from '@/data/serviceContent';
import ServiceHeroSection from '@/components/services/sustainabilityService/ServiceHeroSection';
import ServiceSubFeatureSection from '@/components/services/sustainabilityService/ServiceSubFeatureSection';
import CardGrid from '@/components/CardGrid';
import BannerCTA from '@/components/BannerCTA';
import HowItWorks from '@/components/HowItWorks';
import useScrollReveal from '@/components/useScrollReveal';
import ServicePopup from '@/components/services/sustainabilityService/ServicePopup';
import { servicePopupContent } from '@/components/services/sustainabilityService/servicePopupContent';
import CallbackForm from '@/components/CallbackForm';

export default function ClientPage({ serviceKey }) {
  const content = serviceContent[serviceKey];
  const heroRef = useRef(null);
  const subFeatureRef = useRef(null);
  const howItWorksRef = useRef(null);
  const cardGridRef = useRef(null);
  const wasteGridRef = useRef(null);
  const ctaRef = useRef(null);

  const [showPopup, setShowPopup] = useState(false);
  const [activeSubFeatureIdx, setActiveSubFeatureIdx] = useState(null);
  const [activeSubFeature, setActiveSubFeature] = useState(null);
  const [showCallback, setShowCallback] = useState(false);

  useScrollReveal(heroRef);
  useScrollReveal(subFeatureRef, { delay: 0.1 });
  useScrollReveal(howItWorksRef, { delay: 0.2 });
  useScrollReveal(cardGridRef, { delay: 0.3 });
  useScrollReveal(wasteGridRef, { delay: 0.4 });
  useScrollReveal(ctaRef, { delay: 0.5 });

  const getPopupKey = () => {
    if (!serviceKey || activeSubFeatureIdx == null) return null;
    const eprPopupKeys = ['eprRegistrationCompliance', 'wasteCollectionManagement', 'recyclingPrograms', 'reportingDocumentation'];
    const proPartnershipPopupKeys = [
      'proSelectionDetailed',
      'proAgreementsSla',
      'proCollectionRecyclingOps',
      'proPerformanceReporting',
    ];
    const sustainabilityReportingPopupKeys = [
      'sustainabilityReportingEprReturns',
      'sustainabilityReportingDisclosures',
      'sustainabilityReportingDataAnalytics',
      'sustainabilityReportingRegulatoryCompliance',
    ];
    const complianceOptimizationPopupKeys = [
      'complianceOptimizationCoverageCheck',
      'complianceOptimizationEvidenceReview',
      'complianceOptimizationControlDiagnostics',
      'complianceOptimizationActionRoadmap',
    ];
    const sustainabilityIntegrationPopupKeys = [
      'sustainabilityIntegrationStrategy',
      'sustainabilityIntegrationOperations',
      'sustainabilityIntegrationUnifiedReporting',
      'sustainabilityIntegrationStakeholderCommunication',
    ];
    const serviceMap = {
      'supply-chain-sustainability': [
        'supplyChainAssessment',
        'sustainableSourcing',
        'carbonFootprintReduction',
        'complianceReporting',
      ],
      'extended-producer-responsibility': eprPopupKeys,
      'epr-certificate-procurement': eprPopupKeys,
      'pro-partnerships': proPartnershipPopupKeys,
      'waste-collection-setup': eprPopupKeys,
      'recycling-infrastructure': eprPopupKeys,
      'epr-credit-management': eprPopupKeys,
      'sustainability-reporting': sustainabilityReportingPopupKeys,
      'new-epr-registration': eprPopupKeys,
      'epr-target-management': eprPopupKeys,
      'compliance-optimization': complianceOptimizationPopupKeys,
      'sustainability-integration': sustainabilityIntegrationPopupKeys,
      'epr-certificates': eprPopupKeys,
      'annual-epr-returns': eprPopupKeys,
      'plastic-packaging-epr': eprPopupKeys,
      'epr-construction-demolition': eprPopupKeys,
      'epr-non-ferrous-materials': eprPopupKeys,
      'e-waste-battery-epr': eprPopupKeys,
      'carbon-market-solutions': [
        'carbonFootprintAssessment',
        'carbonCreditTrading',
        'emissionReductionStrategy',
        'complianceReportingCarbon',
      ],
      'water-management-solutions': [
        'waterAuditAssessment',
        'waterConservationStrategy',
        'wastewaterManagement',
        'complianceReportingWater',
      ],
      'maritime-strategy': [
        'SustainabilityAssessment',
        'strategyDevelopment',
        'implementationSupport',
        'reportingDisclosure',
      ],
    };
    return serviceMap[serviceKey]?.[activeSubFeatureIdx] || null;
  };

  const handleLearnMore = (idx, feature) => {
    setActiveSubFeatureIdx(idx);
    setActiveSubFeature(feature || null);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setActiveSubFeatureIdx(null);
    setActiveSubFeature(null);
  };

  const handleRequestCallback = () => {
    setShowPopup(false);
    setShowCallback(true);
  };

  const buildFeaturePopupContent = (feature) => {
    if (!feature) return null;
    const title = feature.title || content?.hero?.title || 'Service Details';
    const subtitle = feature.desc || `Detailed support for ${title.toLowerCase()}.`;
    const bulletFeatures = Array.isArray(feature.bullets) && feature.bullets.length
      ? feature.bullets.slice(0, 6)
      : [
          `${title} scope assessment`,
          'Execution planning and implementation support',
          'Compliance and documentation guidance',
          'Progress tracking and review support',
        ];

    return {
      title,
      subtitle,
      features: bulletFeatures,
      process: [
        { title: 'Discovery', description: `Assess current status and requirements for ${title.toLowerCase()}.` },
        { title: 'Planning', description: 'Define approach, timelines, stakeholders, and key deliverables.' },
        { title: 'Execution', description: 'Implement the agreed plan with periodic checkpoints and updates.' },
        { title: 'Review', description: 'Validate outputs, close gaps, and prepare next-step recommendations.' },
      ],
      benefits: [
        'Clear execution roadmap',
        'Lower compliance and delivery risk',
        'Improved data and documentation quality',
        'Faster decision-making and closure',
      ],
      cta: `Ready to move forward with ${title.toLowerCase()}?`,
    };
  };

  const popupKey = getPopupKey();
  const popupContent = popupKey
    ? servicePopupContent[popupKey] || buildFeaturePopupContent(activeSubFeature)
    : buildFeaturePopupContent(activeSubFeature);

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div ref={heroRef}><ServiceHeroSection {...content.hero} /></div>
      <div ref={subFeatureRef}>
        <ServiceSubFeatureSection {...content.subFeatures} onLearnMore={handleLearnMore} />
      </div>
      {content.howItWorks && (
        <div ref={howItWorksRef}>
          <HowItWorks {...content.howItWorks} />
        </div>
      )}
      <div ref={cardGridRef}><CardGrid {...content.cardGrid} /></div>
      {content.wasteManagementGrid && (
        <div ref={wasteGridRef}><CardGrid {...content.wasteManagementGrid} /></div>
      )}
      <div ref={ctaRef}><BannerCTA {...content.bannerCTA} /></div>
      <ServicePopup
        open={showPopup}
        onClose={handleClosePopup}
        onRequestCallback={handleRequestCallback}
        content={popupContent}
      />
      <CallbackForm open={showCallback} onClose={() => setShowCallback(false)} />
    </div>
  );
}


