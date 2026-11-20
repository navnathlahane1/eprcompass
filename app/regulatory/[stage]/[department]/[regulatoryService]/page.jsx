
import { regulatoryContent } from '@/data/regulatoryContent';
import { notFound } from 'next/navigation';
import RegulatoryServiceClient from './RegulatoryServiceClient';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const stage = decodeSlug(resolvedParams.stage);
  const department = decodeSlug(resolvedParams.department);
  const regulatoryService = decodeSlug(resolvedParams.regulatoryService);
  const key = regulatoryServiceKeyMap[regulatoryService] || null;
  const content = key ? regulatoryContent[key] : undefined;
  
  if (!content) {
    return {
      title: 'Service Not Found - EPR Compass',
      description: 'The requested regulatory service was not found.',
    };
  }
  
  return {
    title: `${content.hero.title} - EPR Compass`,
    description: content.hero.subtitle,
  };
}

function toTitleCase(str) {
  return decodeURIComponent(str)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}


const regulatoryServiceKeyMap = {
  // Accreditations
  "ISM Code Certification": "ismCodeCertification",
  "ISO 9001:2015 Certification": "iso9001Maritime",
  "ISO 14001 Certification": "iso14001Certification",
  "ISO 45001 Certification": "iso45001Certification",
  "ISPS Code Certification": "ispsCodeCertification",
  // Vessel & Company Compliance
  "DOC & SMC": "docSmc",
  "MLC Compliance": "mlcCompliance",
  "Flag State Certification": "flagStateCertification",
  "Vessel Registration": "vesselRegistration",
  // Safety & Environment
  "SOLAS Compliance": "solasCompliance",
  "MARPOL Compliance": "marpolCompliance",
  "Fire Safety (Maritime)": "fireSafetyMaritime",
  "Ballast Water Management": "ballastWaterManagement",
  "Port State Control Readiness": "portStateControlReadiness",
  // Port & Shore Operations
  "Port Authority License": "portAuthorityLicense",
  "Waste Management (Maritime)": "wasteManagementMaritime",
  "ISPS Code (Security)": "ispsCodeSecurity",
  // Data Privacy
  "Data Protection Policy": "dataProtectionPolicy",
  "Personal Data (Crew & Staff)": "personalDataCrewStaff",
  "IT & Cybersecurity Compliance": "itCybersecurityCompliance",
  "Data Breach Readiness": "dataBreachReadiness",
  // Environmental Compliance
  "Environmental Compliance Audit": "environmentalComplianceAudit",
  "Oil & Spill Prevention": "oilSpillPrevention",
  "Air Emissions & GHG Reporting": "airEmissionsGhgReporting",
  "Marine Environment Management": "marineEnvironmentManagement",
};

// URL slug variants that decode to "X and Y" but display as "X & Y" — map to canonical display name for lookup
const regulatoryServiceSlugToDisplayName = {
  "DOC and SMC": "DOC & SMC",
  "ISO 9001-2015 Certification": "ISO 9001:2015 Certification",
};

function decodeSlug(slug) {
  // Handle double-encoded URLs by decoding twice if needed
  let decoded = decodeURIComponent(slug);
  // If it still contains encoded characters, decode again
  if (decoded.includes('%')) {
    decoded = decodeURIComponent(decoded);
  }
  return decoded;
}

export function generateStaticParams() {
  const params = [];

  // Use URL-encoded values to match the live site URLs and avoid Windows file system issues
  const urlMappings = {
    // Accreditations
    "ISM Code Certification": { stage: "Accreditations", department: "ISM", service: "ISM%20Code%20Certification" },
    "ISO 9001:2015 Certification": { stage: "Accreditations", department: "ISO", service: "ISO%209001%3A2015%20Certification" },
    "ISO 14001 Certification": { stage: "Accreditations", department: "ISO", service: "ISO%2014001%20Certification" },
    "ISO 45001 Certification": { stage: "Accreditations", department: "ISO", service: "ISO%2045001%20Certification" },
    "ISPS Code Certification": { stage: "Accreditations", department: "ISPS", service: "ISPS%20Code%20Certification" },
    // Vessel & Company Compliance
    "DOC & SMC": { stage: "Vessel%20Compliance", department: "DOC", service: "DOC%20%26%20SMC" },
    "MLC Compliance": { stage: "Vessel%20Compliance", department: "MLC", service: "MLC%20Compliance" },
    "Flag State Certification": { stage: "Vessel%20Compliance", department: "Flag%20State", service: "Flag%20State%20Certification" },
    "Vessel Registration": { stage: "Vessel%20Compliance", department: "Registration", service: "Vessel%20Registration" },
    // Safety & Environment
    "SOLAS Compliance": { stage: "Safety%20%26%20Environment", department: "SOLAS", service: "SOLAS%20Compliance" },
    "MARPOL Compliance": { stage: "Safety%20%26%20Environment", department: "MARPOL", service: "MARPOL%20Compliance" },
    "Fire Safety (Maritime)": { stage: "Safety%20%26%20Environment", department: "Fire", service: "Fire%20Safety%20(Maritime)" },
    "Ballast Water Management": { stage: "Safety%20%26%20Environment", department: "Environment", service: "Ballast%20Water%20Management" },
    "Port State Control Readiness": { stage: "Safety%20%26%20Environment", department: "PSC", service: "Port%20State%20Control%20Readiness" },
    // Port & Shore Operations
    "Port Authority License": { stage: "Port%20Operations", department: "Authority", service: "Port%20Authority%20License" },
    "Waste Management (Maritime)": { stage: "Port%20Operations", department: "Environment", service: "Waste%20Management%20(Maritime)" },
    "ISPS Code (Security)": { stage: "Port%20Operations", department: "Security", service: "ISPS%20Code%20(Security)" },
    // Data Privacy
    "Data Protection Policy": { stage: "Data%20Privacy", department: "Policy", service: "Data%20Protection%20Policy" },
    "Personal Data (Crew & Staff)": { stage: "Data%20Privacy", department: "PersonalData", service: "Personal%20Data%20(Crew%20%26%20Staff)" },
    "IT & Cybersecurity Compliance": { stage: "Data%20Privacy", department: "Cybersecurity", service: "IT%20%26%20Cybersecurity%20Compliance" },
    "Data Breach Readiness": { stage: "Data%20Privacy", department: "DataBreach", service: "Data%20Breach%20Readiness" },
    // Environmental Compliance
    "Environmental Compliance Audit": { stage: "Environmental%20Compliance", department: "Audit", service: "Environmental%20Compliance%20Audit" },
    "Oil & Spill Prevention": { stage: "Environmental%20Compliance", department: "SpillPrevention", service: "Oil%20%26%20Spill%20Prevention" },
    "Air Emissions & GHG Reporting": { stage: "Environmental%20Compliance", department: "Emissions", service: "Air%20Emissions%20%26%20GHG%20Reporting" },
    "Marine Environment Management": { stage: "Environmental%20Compliance", department: "MarineEnv", service: "Marine%20Environment%20Management" },
  };

  for (const displayName of Object.keys(regulatoryServiceKeyMap)) {
    const key = regulatoryServiceKeyMap[displayName];
    if (!regulatoryContent[key]) continue;
    const mapping = urlMappings[displayName];
    if (mapping) {
      params.push({
        stage: mapping.stage,
        department: mapping.department,
        regulatoryService: mapping.service,
      });
    }
  }
  return params;
}


export default async function Page({ params }) {
  const resolvedParams = await params;
  const stage = decodeSlug(resolvedParams.stage);
  const department = decodeSlug(resolvedParams.department);
  let regulatoryService = decodeSlug(resolvedParams.regulatoryService);
  // Normalize slug to display name where URL uses "and" but key uses "&"
  regulatoryService = regulatoryServiceSlugToDisplayName[regulatoryService] || regulatoryService;
  
  // First try direct mapping
  let key = regulatoryServiceKeyMap[regulatoryService] || null;
  let content = key ? regulatoryContent[key] : undefined;
  
  // If no content found, try with trimmed service name (handle trailing slashes)
  if (!content && regulatoryService) {
    const trimmedService = regulatoryService.trim();
    key = regulatoryServiceKeyMap[trimmedService] || null;
    content = key ? regulatoryContent[key] : undefined;
  }
  
  // Debug direct mapping (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('Direct mapping debug:', {
      regulatoryService,
      key,
      contentExists: !!content,
      contentTitle: content?.hero?.title
    });
  }
  
  // If no content found, try multiple matching strategies
  if (!content && regulatoryService) {
    console.log('Direct mapping failed, trying alternative matches...');
    console.log('Looking for service:', regulatoryService);
    console.log('Available services:', Object.keys(regulatoryServiceKeyMap));
    
    // Strategy 1: Exact match with different spacing
    const exactMatch = Object.keys(regulatoryServiceKeyMap).find(displayName => 
      displayName === regulatoryService
    );
    
    // Strategy 2: Case-insensitive match
    const caseInsensitiveMatch = Object.keys(regulatoryServiceKeyMap).find(displayName => 
      displayName.toLowerCase() === regulatoryService.toLowerCase()
    );
    
    // Strategy 3: Match with normalized spacing
    const normalizedMatch = Object.keys(regulatoryServiceKeyMap).find(displayName => 
      displayName.replace(/\s+/g, ' ').trim() === regulatoryService.replace(/\s+/g, ' ').trim()
    );
    
    // Strategy 4: URL decode and match
    const urlDecodedMatch = Object.keys(regulatoryServiceKeyMap).find(displayName => 
      displayName === decodeURIComponent(regulatoryService)
    );
    
    // Strategy 5: Partial match (for cases where URL encoding might have changed)
    const partialMatch = Object.keys(regulatoryServiceKeyMap).find(displayName => 
      displayName.toLowerCase().includes(regulatoryService.toLowerCase()) ||
      regulatoryService.toLowerCase().includes(displayName.toLowerCase())
    );
    
    const matchingKey = exactMatch || caseInsensitiveMatch || normalizedMatch || urlDecodedMatch || partialMatch;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Alternative matching results:', {
        exactMatch,
        caseInsensitiveMatch,
        normalizedMatch,
        urlDecodedMatch,
        partialMatch,
        finalMatchingKey: matchingKey
      });
    }
    
    if (matchingKey) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Found matching key:', matchingKey);
      }
      key = regulatoryServiceKeyMap[matchingKey];
      content = regulatoryContent[key];
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Alternative mapping result:', {
          key,
          contentExists: !!content,
          contentTitle: content?.hero?.title
        });
      }
      
      if (content) {
        return (
          <RegulatoryServiceClient
            stage={stage}
            department={department}
            regulatoryService={matchingKey}
            serviceKey={key}
            content={content}
          />
        );
      }
    }
  }
  
  // If content was found, render it
  if (content) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Rendering content for:', regulatoryService, 'with key:', key);
    }
    return (
      <RegulatoryServiceClient
        stage={stage}
        department={department}
        regulatoryService={regulatoryService}
        serviceKey={key}
        content={content}
      />
    );
  }
  
  // If still no content found, log detailed error and return 404 (development only)
  if (process.env.NODE_ENV === 'development') {
    console.error('No content found for regulatory service:', {
      regulatoryService,
      stage,
      department,
      availableServices: Object.keys(regulatoryServiceKeyMap),
      availableContent: Object.keys(regulatoryContent)
    });
  }
  
  notFound();
}
