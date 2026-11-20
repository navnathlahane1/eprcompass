import Link from "next/link";
import Image from "next/image";
import { ArrowUp } from "lucide-react";
import PublicBrand from "./public-site/PublicBrand";
import ContactChannels from "./public-site/ContactChannels";
import { footerGroups } from "@/data/publicSite";

export default function Footer({ home = false }) {
  return (
    <footer className={`relative overflow-hidden border-t px-4 pb-4 pt-8 font-[family-name:var(--font-sans)] text-white sm:px-6 lg:px-8 ${home ? "border-[#60377b] bg-[#28104f]" : "border-[#0b4854] bg-[#022936]"}`}>
      <Image src="/imgs/epr-compass/dotted-world-map.webp" alt="" fill sizes="650px" className="pointer-events-none object-contain object-right opacity-[.045]" />
      <div className="relative mx-auto grid max-w-[1240px] gap-8 border-b border-white/10 pb-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
        <div>
          <PublicBrand inverse compact />
          <p className="mt-4 max-w-[270px] text-sm leading-[1.7] text-white/72">EPR Compass is your trusted partner for global EPR compliance, circular economy solutions and a sustainable tomorrow.</p>
          <Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm text-white/80 hover:text-[var(--epr-lime)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Contact our team</Link>
        </div>
        {footerGroups.map((group) => <div key={group.title}><h3 className="text-base font-extrabold">{group.title}</h3><div className="mt-3.5 flex flex-col gap-2">{group.links.map((link) => <Link key={link.label} href={link.href} className="text-sm leading-5 text-white/72 transition hover:text-[var(--epr-lime)]">{link.label}</Link>)}</div></div>)}
        <div>
          <h3 className="text-base font-extrabold">Contact Us</h3>
          <div className="mt-3.5 text-sm leading-[1.65] text-white/78">
            <ContactChannels />
            <Link href="/contact" className="mt-3 block hover:text-[var(--epr-lime)]">Contact our team</Link>
          </div>
        </div>
      </div>
      <div className="relative mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-3 pt-4 text-xs text-white/58 sm:flex-row">
        <p>© 2026 EPR Compass. All rights reserved.</p>
        <div className="flex flex-wrap justify-center gap-5"><Link href="/trust" className="hover:text-white">Trust</Link><span className="text-white/20">|</span><Link href="/verify" className="hover:text-white">Verify certificate</Link><span className="text-white/20">|</span><Link href="/privacy/preferences" className="hover:text-white">Privacy preferences</Link><span className="text-white/20">|</span><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link><span className="text-white/20">|</span><Link href="/terms-and-conditions" className="hover:text-white">Terms &amp; Conditions</Link></div>
      </div>
      <a href="#main-content" aria-label="Back to top" className="absolute bottom-4 right-4 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-[#0b4852] text-[#77d23f] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#105461]"><ArrowUp size={14}/></a>
    </footer>
  );
}

