"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BatteryCharging, BellRing, BookOpenCheck, Boxes, Factory, Globe2, MonitorSmartphone, Package, Search, UserRoundCheck } from "lucide-react";
import countries from "@/data/eprCountries.json";
import { SectionTitle, WorldMapVisual } from "@/components/public-site/PublicVisuals";

const filters = ["All Regions","Asia Pacific","Europe","North America","South America","Middle East & Africa"];
const priority = ["india","european-union","united-states","united-kingdom","canada","australia","japan","united-arab-emirates","south-africa","brazil","indonesia","singapore"];
const categoryIcons = { Plastic:Package, "E-Waste":MonitorSmartphone, Battery:BatteryCharging, Tyre:Factory, Packaging:Boxes };
const northAmerica = new Set(["United States","Canada","Mexico"]);
const southAmerica = new Set(["Brazil","Argentina","Chile","Colombia","Peru"]);

function matchesRegion(country, selected) {
  if (selected === "All Regions") return true;
  if (selected === "Asia Pacific") return country.region === "Asia-Pacific";
  if (selected === "North America") return northAmerica.has(country.name);
  if (selected === "South America") return southAmerica.has(country.name);
  return country.region === selected;
}

function CountryCard({ country }) {
  return (
    <article className="epr-card flex min-h-[252px] flex-col p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[var(--epr-shadow-lg)]">
      <div className="flex items-center gap-3"><span className="text-3xl" aria-hidden="true">{country.flag}</span><div><h3 className="text-[14px] font-bold">{country.name}</h3><p className="text-[11px] text-[var(--epr-muted)]">{country.region}</p></div></div>
      <p className="mt-4 line-clamp-3 text-[11px] leading-[1.15rem] text-[var(--epr-muted)]">{country.regulation}</p>
      <p className="mt-4 text-[11px] font-bold">Key Categories</p>
      <div className="mt-2 flex flex-wrap gap-2">{country.categories.slice(0,5).map((category) => { const Icon = categoryIcons[category] || Package; return <span key={category} title={category} className="grid h-7 w-7 place-items-center rounded-md border border-[var(--epr-border)] bg-[#fbfdfc] text-[var(--epr-green)]"><Icon size={14} strokeWidth={1.6}/></span>; })}</div>
      <Link href={`/epr/${country.slug}`} className="mt-auto inline-flex items-center gap-2 pt-4 text-[11px] font-bold text-[var(--epr-green)]">View Details <ArrowRight size={13}/></Link>
    </article>
  );
}

export default function EprCountriesClient() {
  const [query,setQuery] = useState("");
  const [region,setRegion] = useState("All Regions");
  const [showAll,setShowAll] = useState(false);
  const list = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...countries].filter((country) => matchesRegion(country,region) && (!term || country.name.toLowerCase().includes(term) || country.region.toLowerCase().includes(term))).sort((a,b) => {
      const ai=priority.indexOf(a.slug), bi=priority.indexOf(b.slug);
      if(ai!==-1 || bi!==-1) return (ai===-1?999:ai)-(bi===-1?999:bi);
      return a.name.localeCompare(b.name);
    });
  },[query,region]);
  const visible = showAll ? list : list.slice(0,12);

  return (
    <main className="epr-public">
      <section className="py-6"><div className="epr-container grid min-h-[360px] items-center gap-8 lg:grid-cols-[.78fr_1.22fr]"><div><p className="epr-eyebrow">EPR by Country</p><h1 className="epr-display-inner mt-4">Global EPR Intelligence.<span className="block text-[var(--epr-green)]">Local Compliance.</span></h1><p className="mt-5 max-w-[510px] text-[14px] leading-6 text-[var(--epr-muted)]">Explore Extended Producer Responsibility regulations, categories and compliance requirements by country. Stay compliant in every market you operate.</p><label className="mt-7 flex max-w-[420px] overflow-hidden rounded-lg border border-[var(--epr-border)] bg-white shadow-sm"><span className="sr-only">Search for a country</span><input value={query} onChange={e=>{setQuery(e.target.value);setShowAll(false);}} placeholder="Search for a country..." className="min-h-11 min-w-0 flex-1 border-0 px-4 text-[13px] outline-none"/><span className="grid w-12 place-items-center bg-[var(--epr-green)] text-white"><Search size={18}/></span></label></div><div><WorldMapVisual/><div className="grid grid-cols-2 divide-x divide-[var(--epr-border)] sm:grid-cols-4">{[["50+","Countries Covered"],["5","Continents"],["20+","EPR Categories"],["100%","Regulatory Updates"]].map(([value,label])=><div key={label} className="px-2 text-center"><p className="text-xl font-extrabold text-[var(--epr-green)]">{value}</p><p className="mt-1 text-[11px] text-[var(--epr-muted)]">{label}</p></div>)}</div></div></div></section>

      <section className="bg-[#f8faf9] py-10"><SectionTitle title="Browse by Region"/><div className="epr-container mt-6 flex flex-wrap justify-center gap-3" role="group" aria-label="Filter countries by region">{filters.map((label)=><button key={label} type="button" onClick={()=>{setRegion(label);setShowAll(false);}} aria-pressed={region===label} className={`min-h-9 rounded-full border px-6 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--epr-green)] ${region===label?"border-[var(--epr-green)] bg-white text-[var(--epr-green)]":"border-[var(--epr-border)] bg-[#fbfdfc] text-[var(--epr-muted)] hover:border-[#7db7a1]"}`}>{label}</button>)}</div><div className="epr-container mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{visible.map(country=><CountryCard key={country.slug} country={country}/>)}</div>{visible.length===0?<p className="py-14 text-center text-sm text-[var(--epr-muted)]" role="status">No countries match your search.</p>:null}{!showAll&&list.length>12?<button onClick={()=>setShowAll(true)} className="epr-button epr-button-secondary mx-auto mt-7">View All Countries <ArrowRight size={14}/></button>:null}</section>

        <section className="py-7"><div className="epr-container grid gap-4 lg:grid-cols-[1.25fr_.75fr]"><div className="rounded-xl bg-[var(--epr-pale)] p-7"><h2 className="text-xl font-bold">Stay Ahead with <span className="text-[var(--epr-green)]">EPR Compass Insights</span></h2><p className="mt-2 text-[12px] text-[var(--epr-muted)]">Access the latest regulatory updates, policy changes and compliance guidelines across the globe.</p><div className="mt-7 grid grid-cols-2 gap-5 sm:grid-cols-4">{[[Globe2,"Regulatory Updates","Real-time updates on EPR laws and notifications."],[BookOpenCheck,"Country Guides","In-depth guides for EPR compliance."],[UserRoundCheck,"Expert Analysis","Insights from EPR and sustainability experts."],[BellRing,"Compliance Alerts","Never miss an important compliance deadline."]].map(([Icon,label,text])=><div key={label}><Icon size={25} className="text-[var(--epr-green)]"/><h3 className="mt-3 text-[11px] font-bold text-[var(--epr-green)]">{label}</h3><p className="mt-1 text-[11px] leading-4 text-[var(--epr-muted)]">{text}</p></div>)}</div></div><div className="relative min-h-[230px] overflow-hidden rounded-xl bg-[#07463f] p-7 text-white"><div className="absolute inset-y-0 left-0 w-[48%]"><Image src="/imgs/epr-compass/circular-earth-hero.png" alt="Green globe representing global EPR coverage" fill sizes="340px" className="object-cover object-center opacity-90"/><div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(7,70,63,.9))]"/></div><div className="relative ml-auto w-[55%]"><h2 className="text-2xl font-bold leading-tight">Expand Globally.<br/>Comply Locally.</h2><p className="mt-3 text-[12px] leading-5 text-white/72">EPR Compass helps businesses comply with EPR regulations across every market.</p><Link href="/contact?intent=meeting&amp;source=epr_countries_expert_cta" className="epr-button mt-5 bg-white text-[var(--epr-green)]">Request a Meeting <ArrowRight size={14}/></Link></div></div></div></section>
    </main>
  );
}

