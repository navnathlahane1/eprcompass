import {
  BadgeCheck,
  Building2,
  ClipboardCheck,
  Factory,
  Globe2,
  Headphones,
  Leaf,
  Recycle,
  ShieldCheck,
  Truck,
  UserRoundCheck,
  Users,
  MapPin,
} from "lucide-react";
import Image from "next/image";

const orbitItems = {
  home: [
    [Factory, "Producers & Brand Owners"],
    [Users, "Consultants"],
    [BadgeCheck, "Credits & Certificates"],
    [Recycle, "Recyclers"],
    [Building2, "Regulators"],
  ],
  services: [
    [Users, "Registration"],
    [ClipboardCheck, "Implementation"],
    [Recycle, "Recycling & Credits"],
    [ClipboardCheck, "Reporting"],
    [BadgeCheck, "Compliance"],
    [UserRoundCheck, "Advisory & Support"],
  ],
  partners: [
    [Recycle, "Recyclers & Aggregators"],
    [Users, "Consultants & Advisors"],
    [Factory, "Waste Processors"],
    [BadgeCheck, "Credit Providers"],
    [Truck, "Logistics Partners"],
    [Globe2, "Technology Partners"],
  ],
  about: [
    [Factory, "Producers & Brand Owners"],
    [ClipboardCheck, "Compliance Management"],
    [BadgeCheck, "EPR Certificates & Credits"],
    [Recycle, "Recyclers & Waste Processors"],
    [Users, "Consultants & Advisors"],
    [Building2, "Regulators"],
  ],
};

export function OrbitDiagram({ variant = "home", className = "" }) {
  const items = orbitItems[variant] || orbitItems.home;
  const compact = variant === "services" || variant === "partners" || variant === "about";
  return (
    <div className={`relative mx-auto aspect-square w-full ${compact ? "max-w-[410px]" : "max-w-[470px]"} ${className}`} aria-hidden="true">
      {variant !== "about" ? <Image src="/imgs/epr-compass/dotted-world-map.webp" alt="" fill sizes="520px" className="pointer-events-none scale-[1.35] object-contain opacity-[0.22]" /> : null}
      <div className="absolute inset-[14%] rounded-full border border-dashed border-[var(--epr-green)]/45 bg-[radial-gradient(circle,#ffffff_0%,#eef9f3_62%,transparent_63%)]" />
      <div className="absolute inset-[30%] z-10 flex flex-col items-center justify-center rounded-full border border-[var(--epr-border)] bg-white text-center shadow-[0_16px_45px_rgba(8,72,55,0.14)]">
        <Image src="/imgs/epr-compass/epr-compass-platform.png" alt="" width={52} height={52} className="h-12 w-12 rounded-full object-contain" />
        <strong className="mt-2 text-lg text-[#28104f]">EPR Compass</strong>
        <span className="mt-1 text-xs leading-tight text-[#587078]">Clear EPR direction.<br />One platform.</span>
      </div>
      {items.map(([Icon, label], index) => {
        const positions = ["left-1/2 top-0 -translate-x-1/2", "right-[2%] top-[22%]", "bottom-[8%] right-[8%]", "bottom-0 left-1/2 -translate-x-1/2", "bottom-[8%] left-[8%]", "left-[2%] top-[22%]"];
        return (
          <div key={label} className={`absolute z-20 flex w-[104px] flex-col items-center text-center ${positions[index]}`}>
            <span className="grid h-11 w-11 place-items-center rounded-full border border-[var(--epr-border)] bg-white text-[var(--epr-green)] shadow-md">
              <Icon size={23} strokeWidth={1.8} />
            </span>
            <span className="mt-1.5 text-xs font-bold leading-tight text-[var(--epr-ink)]">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function WorldMapVisual({ support = false }) {
  const pins = support ? [ClipboardCheck, Building2, Recycle, BadgeCheck, UserRoundCheck] : [MapPin, MapPin, MapPin, MapPin, MapPin, MapPin, MapPin];
  return (
    <div className="relative mx-auto aspect-[16/9] w-full max-w-[600px] overflow-hidden" aria-hidden="true">
      <Image src="/imgs/epr-compass/dotted-world-map.webp" alt="" fill sizes="600px" className="object-contain opacity-75" />
      <svg viewBox="0 0 820 390" className="absolute inset-0 h-full w-full" fill="none" stroke="#63b79a" strokeWidth="1.3" strokeDasharray="4 6">
        <path d="M137 160Q320 45 430 180T690 137" />
        <path d="M207 269Q356 122 505 226T680 276" />
      </svg>
      {support ? <div className="absolute inset-0 flex items-center justify-center"><span className="grid h-24 w-24 place-items-center rounded-full border-8 border-[#edf7f2] bg-white text-[#07875f] shadow-lg"><Headphones size={45} /></span></div> : null}
      {pins.map((Icon, index) => {
        const supportPos = ["left-[16%] top-[23%]", "right-[18%] top-[18%]", "left-[23%] bottom-[15%]", "right-[23%] bottom-[12%]", "left-1/2 top-[4%] -translate-x-1/2"];
        const mapPos = ["left-[15%] top-[31%]", "left-[27%] top-[22%]", "left-[34%] bottom-[19%]", "left-[51%] top-[33%]", "right-[27%] top-[23%]", "right-[17%] top-[42%]", "right-[21%] bottom-[14%]"];
        return support ? <span key={index} className={`absolute grid h-10 w-10 place-items-center rounded-full border border-[#dbeae2] bg-white text-[#07875f] shadow ${supportPos[index]}`}><Icon size={20} /></span> : <span key={index} className={`absolute text-[#07875f] drop-shadow-sm ${mapPos[index]}`}><Icon size={25} fill="#07875f" strokeWidth={1.6}/></span>;
      })}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, subtitle, centered = true, showRule = true }) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#07875f]">{eyebrow}</p> : null}
      <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[var(--epr-ink)] sm:text-[28px]">{title}</h2>
      {subtitle ? <p className="mt-2 text-base leading-6 text-[#607279]">{subtitle}</p> : null}
      {showRule ? <span className={`mt-3 block h-0.5 w-8 bg-[#07875f] ${centered ? "mx-auto" : ""}`} /> : null}
    </div>
  );
}

export function IconBadge({ icon: Icon, size = "md", dark = false }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full transition-transform duration-300 ${size === "lg" ? "h-16 w-16" : "h-12 w-12"} ${dark ? "bg-[#0c4d45] text-[#7bd340]" : "bg-[#eef7e7] text-[#07875f]"}`}>
      <Icon size={size === "lg" ? 30 : 23} strokeWidth={1.8} />
    </span>
  );
}

export function PublicCta({ title, text, href = "/get-matched", label = "Get Started Now" }) {
  return (
    <section className="mx-auto my-10 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-xl bg-[linear-gradient(100deg,#0a4b44,#075b47)] px-6 py-7 text-white shadow-[0_18px_45px_rgba(5,76,62,0.18)] sm:px-10">
        <div className="absolute -left-10 -top-16 h-44 w-44 animate-epr-blob rounded-full bg-[#6ee7b7]/20 blur-2xl" />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.02em]">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">{text}</p>
          </div>
          <a href={href} className="inline-flex min-h-11 shrink-0 items-center rounded-lg bg-white px-6 py-3 text-sm font-bold text-[#087a59] shadow transition hover:bg-[#effbf5]">
            {label} <span className="ml-2">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
