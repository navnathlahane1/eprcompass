"use client";

import { useSearchParams } from "next/navigation";
import ContactForm from "@/components/contact/ContactForm";
import ContactFaq from "@/components/contact/ContactFaq";
import { WorldMapVisual } from "@/components/public-site/PublicVisuals";
import ContactChannels from "@/components/public-site/ContactChannels";

const faqData = [
  {question:"What is EPR and who needs to comply?",answer:"Extended Producer Responsibility applies to producers, importers and brand owners covered by category-specific waste-management rules."},
  {question:"How long does EPR registration take?",answer:"Timelines vary by category and document readiness. Our team confirms an expected schedule after reviewing your applicability."},
  {question:"Which EPR categories do you support?",answer:"We support Plastic, E-Waste, Battery, Tyre, Used Oil, ELV, C&D and other emerging categories."},
  {question:"Do you provide EPR certificates/credits?",answer:"Yes. We support verified certificate sourcing, reconciliation, documentation and retirement evidence."},
  {question:"How does EPR Compass help with EPR compliance?",answer:"We coordinate applicability, registration, filings, partner workflows, certificates and audit-ready reporting."},
  {question:"How can I track my EPR compliance status?",answer:"Our technology-enabled workflows provide clear milestones, reminders and compliance reporting."},
];

export default function ContactPage() {
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent") || "general";
  const requestedProgram = searchParams.get("program") || "";
  const program = intent === "academy" && /^tier-[123]$/.test(requestedProgram) ? requestedProgram : "";
  const ctaVariant = searchParams.get("cta") === "b" ? "b" : "a";
  const industrySlug = searchParams.get("industry") || "";
  const industryLabel = industrySlug ? industrySlug.split("-").map(part=>part.charAt(0).toUpperCase()+part.slice(1)).join(" ") : "";
  const isMeetingRequest = intent === "meeting";
  const requestSource = (searchParams.get("source") || "contact_page").replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
  const recyclerSlug = (searchParams.get("recycler") || "").replace(/[^a-z0-9-]/gi, "").slice(0, 100);
  const requestContext = recyclerSlug ? `Recycler profile: ${recyclerSlug}` : industryLabel ? `Industry: ${industryLabel}` : "";
  const tailored = intent !== "general";
  const config = isMeetingRequest
    ? {title:"Request a Meeting",subtitle:"Share your details and our team will contact you to arrange a suitable time to discuss your EPR needs.",formTitle:"Meeting Request Details",placeholder:"What would you like to discuss?",submit:"Send Meeting Request"}
    : tailored
      ? {title:"Get Focused EPR Support",subtitle:"Tell us about your current compliance requirement and our specialists will prepare a focused response.",formTitle:"Send Us Your Requirement",placeholder:"Describe the EPR support or review you need.",submit:"Request Support"}
      : {title:"We’re Here to Help You with EPR.",subtitle:"Have questions about EPR compliance or our platform? Our team is ready to assist you.",formTitle:"Send Us a Message",placeholder:"How can we help you?",submit:"Send Message"};

  return (
    <main className="epr-public">
      <section className="border-b border-[var(--epr-border)]"><div className="epr-container grid min-h-[320px] items-center gap-8 py-6 lg:grid-cols-[.9fr_1.1fr]"><div><p className="epr-eyebrow">{isMeetingRequest ? "Talk with EPR Compass" : "Contact Us"}</p><h1 className="epr-display-inner mt-4">{tailored?config.title:<>We’re Here to<br/>Help You with <span className="text-[var(--epr-green)]">EPR.</span></>}</h1><p className="mt-5 max-w-[520px] text-[15px] leading-6 text-[var(--epr-muted)]">{config.subtitle}</p></div><WorldMapVisual support/></div></section>

      <section className="epr-section"><div className="epr-container grid gap-10 lg:grid-cols-[.72fr_1.28fr]"><div><h2 className="text-[22px] font-bold">{isMeetingRequest ? "What happens next" : "Contact details"}</h2><span className="mt-2 block h-0.5 w-9 bg-[var(--epr-green)]"/><p className="mt-5 max-w-sm text-sm leading-6 text-[var(--epr-muted)]">{isMeetingRequest ? "Send your details and a short note about what you need. Our team will review your request and contact you to arrange a suitable meeting time." : "Have a question? Email or WhatsApp our team, or send a message using the form."}</p><ContactChannels className="mt-5 text-sm font-semibold leading-6 text-[var(--epr-green)]" /></div><div className="border-[var(--epr-border)] lg:border-l lg:pl-10"><ContactForm key={`${intent}:${program}:${requestSource}:${recyclerSlug}`} program={program} intent={intent} ctaVariant={ctaVariant} industryLabel={industryLabel} requestSource={requestSource} requestContext={requestContext} formTitle={config.formTitle} messagePlaceholder={config.placeholder} submitLabel={config.submit} successLabel={isMeetingRequest ? "Thanks — your meeting request has been received. Our team will contact you to arrange a suitable time." : undefined}/></div></div></section>

      <ContactFaq faqData={faqData}/>
    </main>
  );
}

