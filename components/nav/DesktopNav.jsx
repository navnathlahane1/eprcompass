'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Calendar, Globe } from 'lucide-react';
import MegaMenu, { MegaMenuScope } from './MegaMenu';
import { activeNavSection } from './activeSection';
import {
  academyPrograms,
  marketplaceLinks,
  marketplaceExtraLink,
  solutionColumns,
  toolsMenu,
  partnerLinks,
  learnResourceLinks,
  learnCountryLinks,
} from './data';

export default function DesktopNav() {
  const pathname = usePathname();
  const active = activeNavSection(pathname);
  const isSolutionsPath = active === 'platform';
  const isToolsPath = active === 'tools';
  const isMarketplacePath = active === 'marketplace';
  const isLearnPath = active === 'learn';
  const isPartnersPath = active === 'partners';

  return (
    <MegaMenuScope key={pathname}>
    <ul className="hidden min-w-0 flex-1 items-center justify-center gap-5 font-[family-name:var(--font-sans)] xl:flex 2xl:gap-7">
      <MegaMenu label="Platform" active={isSolutionsPath}>
        {({ close }) => (
          <div>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[#dfe9e4] pb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#07875f]">Platform modules</p>
                <h4 className="text-lg font-extrabold text-[#102c32]">Workflows, filings, records and industries</h4>
              </div>
              <Link href="/services" onClick={close} className="inline-flex items-center gap-1 text-sm font-semibold text-[#07875f] hover:underline">
                View platform <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {solutionColumns.map((column) => (
                <div key={column.heading} className="min-w-0">
                  <h4 className="mb-3 text-sm font-bold text-[#07875f]">{column.heading}</h4>
                  <div className="space-y-1">
                    {column.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={close}
                          className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-[#eff8f1]"
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eff8f1] text-[#07875f]">
                            <Icon size={14} />
                          </span>
                          <span className="text-[13px] font-medium leading-snug text-[#102c32]">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                  {column.footer ? (
                    <Link
                      href={column.footer.href}
                      onClick={close}
                      className="mt-2 inline-flex items-center gap-1 px-2 text-xs font-semibold text-[#07875f] hover:underline"
                    >
                      {column.footer.label} <ArrowRight size={12} />
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </MegaMenu>

      <MegaMenu label="Tools" active={isToolsPath}>
        {({ close }) => (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
            <div>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#07875f]">Free tools</p>
                  <h4 className="text-lg font-extrabold text-[#102c32]">Check risk, then move into workflow</h4>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {toolsMenu.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className="group flex gap-3 rounded-xl border border-[#dfe9e4] bg-white p-3.5 transition hover:border-[#07875f]/40 hover:shadow-md"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eff8f1] text-[#07875f]">
                        <Icon size={18} />
                      </span>
                      <span>
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#102c32] group-hover:text-[#07875f]">{item.label}</span>
                          {item.badge ? (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}>{item.badge}</span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-[#607279]">{item.desc}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <aside className="flex flex-col justify-between rounded-2xl bg-[#032f3a] p-5 text-white">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#78c943]">Most used</p>
                <h4 className="mt-2 text-xl font-extrabold leading-snug">Not sure if PWM applies?</h4>
                <p className="mt-2 text-sm leading-relaxed text-white/75">Run the penalty checker, then contact us about your compliance workflow.</p>
              </div>
              <div className="mt-6 space-y-2">
                <Link href="/epr-penalty-checker" onClick={close} className="flex min-h-11 items-center justify-center rounded-lg bg-[#07875f] text-sm font-bold hover:bg-[#066e4e]">
                  Check CPCB notices
                </Link>
                <Link href="/contact" onClick={close} className="flex min-h-11 w-full items-center justify-center rounded-lg border border-white/25 text-sm font-bold hover:bg-white/10">
                  Contact us
                </Link>
              </div>
            </aside>
          </div>
        )}
      </MegaMenu>

      <MegaMenu label="Marketplace" active={isMarketplacePath}>
        {({ close }) => (
          <>
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#dfe9e4] pb-4">
              <div>
                <h4 className="text-lg font-extrabold text-[#102c32]">EPR Marketplace</h4>
                <p className="mt-1 text-xs text-[#607279]">Trade credits, find a consultant, connect with recyclers</p>
              </div>
              <Link
                href={marketplaceExtraLink.href}
                onClick={close}
                className="shrink-0 text-sm font-semibold text-[#07875f] hover:underline"
              >
                {marketplaceExtraLink.label} <ArrowRight size={14} className="inline" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {marketplaceLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={close}
                    className="group flex flex-col gap-2.5 rounded-xl border border-[#dfe9e4] bg-white p-4 transition hover:border-[#07875f]/50 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eff8f1] text-[#07875f]">
                        <Icon size={16} />
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-sm font-bold leading-snug text-[#102c32] group-hover:text-[#07875f]">{item.label}</p>
                    <p className="text-xs leading-snug text-[#607279]">{item.desc}</p>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </MegaMenu>

      <MegaMenu label="Learn" active={isLearnPath}>
        {({ close }) => (
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.4fr_0.9fr_0.7fr]">
            <div>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#07875f]">Courses</p>
                  <h4 className="text-lg font-extrabold text-[#102c32]">Pick a path by role</h4>
                </div>
                <Link href="/courses" onClick={close} className="inline-flex items-center gap-1 text-sm font-semibold text-[#07875f] hover:underline">
                  Browse courses <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {academyPrograms.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={close}
                      className="group flex gap-3 rounded-xl border border-[#dfe9e4] p-3.5 transition hover:border-[#07875f]/40 hover:shadow-md"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eff8f1] text-[#07875f]">
                        <Icon size={18} />
                      </span>
                      <span>
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#102c32] group-hover:text-[#07875f]">{item.label}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}>{item.badge}</span>
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-[#607279]">{item.desc}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
              <Link href="/training_calendar" onClick={close} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#07875f] hover:underline">
                <Calendar size={13} /> Training calendar
              </Link>
            </div>
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#07875f]">Guides</p>
              <ul className="space-y-1">
                {learnResourceLinks.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={close} className="block rounded-lg px-2 py-2 text-sm font-medium text-[#102c32] hover:bg-[#eff8f1] hover:text-[#07875f]">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#07875f]">By country</p>
              <ul className="space-y-1">
                {learnCountryLinks.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={close} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#102c32] hover:bg-[#eff8f1] hover:text-[#07875f]">
                      <Globe size={14} className="text-[#07875f]" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </MegaMenu>

      <MegaMenu label="Partners" active={isPartnersPath}>
        {({ close }) => (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {partnerLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="group rounded-xl border border-[#dfe9e4] p-4 transition hover:border-[#07875f]/50 hover:shadow-md"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eff8f1] text-[#07875f]">
                    <Icon size={18} />
                  </span>
                  <p className="mt-3 text-sm font-bold text-[#102c32] group-hover:text-[#07875f]">{item.label}</p>
                  <p className="mt-1 text-xs leading-snug text-[#607279]">{item.desc}</p>
                </Link>
              );
            })}
          </div>
        )}
      </MegaMenu>
    </ul>
    </MegaMenuScope>
  );
}
