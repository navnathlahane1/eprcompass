'use client';

import { useMemo, useState } from 'react';

type Props = {
  defaultValue?: string | null;
};

const INDUSTRY_MAP: Record<string, string[]> = {
  'Information Technology & Services': [
    'Software Development',
    'IT Consulting',
    'Cloud Services',
    'Cybersecurity',
    'Data & Analytics',
    'Managed Services'
  ],
  'Manufacturing': [
    'Automotive Components',
    'Industrial Machinery',
    'Electronics Manufacturing',
    'Packaging',
    'Chemicals',
    'Consumer Goods Manufacturing'
  ],
  'Environmental Services': [
    'EPR Compliance',
    'Waste Management',
    'Recycling Operations',
    'Sustainability Consulting',
    'Environmental Audits',
    'Carbon & ESG Services'
  ],
  Healthcare: [
    'Hospitals & Clinics',
    'Pharmaceuticals',
    'Medical Devices',
    'Diagnostics',
    'HealthTech'
  ],
  Finance: [
    'Banking',
    'NBFC',
    'Insurance',
    'FinTech',
    'Investment Services'
  ],
  Education: [
    'Higher Education',
    'K-12 Schools',
    'EdTech',
    'Vocational Training',
    'Corporate Training'
  ],
  Retail: [
    'E-commerce',
    'FMCG Retail',
    'Fashion & Apparel',
    'Electronics Retail',
    'B2B Distribution'
  ],
  'Logistics & Supply Chain': [
    'Freight & Transportation',
    'Warehousing',
    'Last Mile Delivery',
    '3PL/4PL',
    'Cold Chain Logistics'
  ],
  Construction: [
    'Infrastructure',
    'Real Estate Development',
    'Building Materials',
    'Engineering Services'
  ],
  Energy: [
    'Renewable Energy',
    'Power Generation',
    'Oil & Gas',
    'Energy Storage',
    'Utilities'
  ],
  Agriculture: [
    'Agri Inputs',
    'Food Processing',
    'AgriTech',
    'Farm Equipment',
    'Dairy & Livestock'
  ],
  Telecommunications: [
    'Telecom Services',
    'Network Infrastructure',
    'ISP',
    'Enterprise Communications'
  ]
};

function parseIndustry(rawValue?: string | null) {
  const value = String(rawValue || '').trim();
  if (!value) return { industry: '', subIndustry: '' };

  const parts = value.split('>').map((part) => part.trim());
  if (parts.length >= 2) {
    return { industry: parts[0], subIndustry: parts.slice(1).join(' > ') };
  }

  return { industry: value, subIndustry: '' };
}

export default function IndustrySubindustryFields({ defaultValue }: Props) {
  const parsed = parseIndustry(defaultValue);
  const [industry, setIndustry] = useState(parsed.industry);
  const [subIndustry, setSubIndustry] = useState(parsed.subIndustry);

  const industries = useMemo(() => Object.keys(INDUSTRY_MAP), []);
  const subIndustryOptions = INDUSTRY_MAP[industry] || [];

  const combinedIndustryValue = industry
    ? subIndustry
      ? `${industry} > ${subIndustry}`
      : industry
    : '';

  return (
    <>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Industry</label>
        <select
          value={industry}
          onChange={(event) => {
            const nextIndustry = event.target.value;
            setIndustry(nextIndustry);
            setSubIndustry('');
          }}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
        >
          <option value="">Select Industry</option>
          {industries.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Sub-Industry</label>
        <select
          value={subIndustry}
          onChange={(event) => setSubIndustry(event.target.value)}
          disabled={!industry}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:disabled:bg-gray-900"
        >
          <option value="">Select Sub-Industry</option>
          {subIndustryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <input type="hidden" name="industry" value={combinedIndustryValue} />
    </>
  );
}
