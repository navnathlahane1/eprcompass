'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import MobileSection from './MobileSection';
import { activeNavSection } from './activeSection';
import {
  marketplaceLinks,
  marketplaceExtraLink,
  toolsMenu,
  academyPrograms,
  partnerLinks,
  learnResourceLinks,
  learnCountryLinks,
  solutionColumns,
} from './data';

export default function MobileMenu({ onClose }) {
  const pathname = usePathname();
  const closeAll = () => onClose?.();
  const active = activeNavSection(pathname);
  const isSolutions = active === 'platform';
  const isTools = active === 'tools';
  const isMarketplace = active === 'marketplace';
  const isLearn = active === 'learn';
  const isPartners = active === 'partners';

  return (
    <ul id="mobile-nav" className="flex flex-col gap-1 px-1 py-2 text-base text-[#102c32]">
      <MobileSection title="Platform" isActive={isSolutions} defaultOpen={isSolutions}>
        {solutionColumns.map((column) => (
          <div key={column.heading} className="mb-3">
            <div className="mb-1 text-sm font-semibold text-[#07875f]">{column.heading}</div>
            <ul className="flex flex-col">
              {column.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="block py-2 min-h-[44px] text-sm hover:text-[#07875f]" onClick={closeAll}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            {column.footer ? (
              <Link href={column.footer.href} className="inline-flex items-center gap-1 py-2 text-sm font-semibold text-[#07875f]" onClick={closeAll}>
                {column.footer.label} <ArrowRight size={14} />
              </Link>
            ) : null}
          </div>
        ))}
        <Link href="/services" className="inline-flex items-center gap-1 py-2 text-sm font-semibold text-[#07875f]" onClick={closeAll}>
          View platform <ArrowRight size={14} />
        </Link>
      </MobileSection>

      <MobileSection title="Tools" isActive={isTools} defaultOpen={isTools}>
        <ul className="flex flex-col gap-0.5">
          {toolsMenu.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block py-2.5 min-h-[44px] text-sm hover:text-[#07875f]" onClick={closeAll}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </MobileSection>

      <MobileSection title="Marketplace" isActive={isMarketplace} defaultOpen={isMarketplace}>
        <ul className="flex flex-col gap-1">
          {marketplaceLinks.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="block py-2 min-h-[44px] text-sm hover:text-[#07875f]" onClick={closeAll}>
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href={marketplaceExtraLink.href} className="block py-2 min-h-[44px] text-sm text-[#607279] hover:text-[#07875f]" onClick={closeAll}>
              {marketplaceExtraLink.label}
            </Link>
          </li>
        </ul>
      </MobileSection>

      <MobileSection title="Learn" isActive={isLearn} defaultOpen={isLearn}>
        <div className="mb-3 text-sm font-semibold text-[#07875f]">Courses</div>
        <ul className="mb-4 flex flex-col">
          {academyPrograms.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block py-2 min-h-[44px] text-sm hover:text-[#07875f]" onClick={closeAll}>
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/courses" className="inline-flex items-center gap-1 py-2 text-sm font-semibold text-[#07875f]" onClick={closeAll}>
              Browse courses <ArrowRight size={14} />
            </Link>
          </li>
        </ul>
        <Link href="/training_calendar" onClick={closeAll} className="mb-4 block min-h-11 py-2 text-sm font-semibold text-[#07875f]">Training calendar</Link>
        <div className="mb-1 text-sm font-semibold text-[#07875f]">Guides</div>
        <ul className="mb-4 flex flex-col">
          {learnResourceLinks.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block py-2 min-h-[44px] text-sm hover:text-[#07875f]" onClick={closeAll}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mb-1 text-sm font-semibold text-[#07875f]">By country</div>
        <ul className="flex flex-col">
          {learnCountryLinks.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block py-2 min-h-[44px] text-sm hover:text-[#07875f]" onClick={closeAll}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </MobileSection>

      <MobileSection title="Partners" isActive={isPartners} defaultOpen={isPartners}>
        <ul className="flex flex-col">
          {partnerLinks.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block py-2 min-h-[44px] text-sm hover:text-[#07875f]" onClick={closeAll}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </MobileSection>
    </ul>
  );
}
