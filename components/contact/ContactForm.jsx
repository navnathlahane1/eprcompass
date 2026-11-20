"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { submitToGoogleScript } from "@/lib/googleScript";
import { getLeadAttribution, trackLeadEvent } from "@/lib/leadTracking";

const initialForm = { name:"", email:"", company:"", countryCode:"+91", phone:"", subject:"", message:"", consent:false };

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Please enter your full name.";
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Please enter a valid work email.";
  if (!values.company.trim()) errors.company = "Please enter your company name.";
  if (!/^\d{7,15}$/.test(values.phone.replace(/\D/g,""))) errors.phone = "Enter a valid phone number.";
  if (!values.subject.trim()) errors.subject = "Please enter a subject.";
  if (!values.message.trim()) errors.message = "Please tell us how we can help.";
  if (!values.consent) errors.consent = "Please accept the privacy policy and terms.";
  return errors;
}

function FieldError({ id, children }) {
  return children ? <p id={id} role="alert" className="mt-1 text-[11px] text-red-600">{children}</p> : null;
}

export default function ContactForm({
  intent = "general",
  program = "",
  ctaVariant = "a",
  industryLabel = "",
  requestSource = "contact_page",
  requestContext = "",
  formTitle = "Send Us a Message",
  formSubtitle = "",
  messagePlaceholder = "How can we help you?",
  submitLabel = "Send Message",
  successLabel = "Thank you. Your message has been sent successfully.",
}) {
  const router = useRouter();
  const [formData,setFormData] = useState(() => ({
    ...initialForm,
    subject: intent === "academy" ? `Academy access request${program ? `: ${program}` : ""}` : intent === "meeting" ? "EPR meeting request" : "",
    message: intent === "meeting" ? "I would like to arrange a meeting to discuss my EPR requirements. Please contact me with a suitable time." : "",
  }));
  const [errors,setErrors] = useState({});
  const [status,setStatus] = useState("idle");
  const [statusMessage,setStatusMessage] = useState("");

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setFormData((current) => ({...current,[name]:type==="checkbox"?checked:value}));
    if (errors[name]) setErrors((current) => ({...current,[name]:undefined}));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(formData);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setStatus("error");
      setStatusMessage("Please correct the highlighted fields.");
      document.getElementById(Object.keys(nextErrors)[0])?.focus();
      return;
    }
    setErrors({});
    setStatus("loading");
    setStatusMessage("");
    try {
      await submitToGoogleScript({ type:"Contact_Form", ...formData, phone:`${formData.countryCode} ${formData.phone}`, intent, source:requestSource, requestContext, program, industry:industryLabel || "" });
      setStatus("success");
      setStatusMessage(successLabel);
      setFormData(initialForm);
      const query = new URLSearchParams({source:"contact",intent,cta:ctaVariant,requestSource});
      if (industryLabel) query.set("industry",industryLabel);
      if (program) query.set("program", program);
      trackLeadEvent("contact_form_submitted", {intent,request_source:requestSource,request_context:requestContext||null,cta_variant:ctaVariant,industry:industryLabel||null,form_type:"contact_form",page_path:window.location.pathname,...getLeadAttribution(window.location.pathname)});
      setTimeout(() => router.push(`/thank-you?${query.toString()}`), 1600);
    } catch (error) {
      setStatus("error");
      setStatusMessage(error?.message || "We could not send your message. Please try again.");
    }
  };

  const inputClass = "min-h-11 w-full rounded-md border border-[var(--epr-border)] bg-white px-3 text-[12px] text-[var(--epr-ink)] outline-none transition focus:border-[var(--epr-green)] focus:ring-1 focus:ring-[var(--epr-green)] disabled:opacity-55";
  const describedBy = (name) => errors[name] ? `${name}-error` : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full" aria-busy={status==="loading"}>
      <h2 className="text-[22px] font-bold">{formTitle}</h2><span className="mt-2 block h-0.5 w-9 bg-[var(--epr-green)]"/>{formSubtitle?<p className="mt-3 text-[12px] text-[var(--epr-muted)]">{formSubtitle}</p>:null}{industryLabel?<p className="mt-3 text-[11px] font-semibold uppercase tracking-[.12em] text-[var(--epr-green)]">Industry Context: {industryLabel}</p>:null}
      {program ? <p className="mt-3 text-sm font-semibold text-[var(--epr-green)]">Academy program: {program}</p> : null}
      {requestContext ? <p className="mt-3 text-sm font-semibold text-[var(--epr-green)]">{requestContext}</p> : null}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div><label className="sr-only" htmlFor="name">Full Name</label><input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name*" autoComplete="name" disabled={status==="loading"} aria-invalid={!!errors.name} aria-describedby={describedBy("name")} className={inputClass}/><FieldError id="name-error">{errors.name}</FieldError></div>
        <div><label className="sr-only" htmlFor="email">Work Email</label><input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Work Email*" autoComplete="email" disabled={status==="loading"} aria-invalid={!!errors.email} aria-describedby={describedBy("email")} className={inputClass}/><FieldError id="email-error">{errors.email}</FieldError></div>
      </div>
      <div className="mt-3"><label className="sr-only" htmlFor="company">Company Name</label><input id="company" name="company" value={formData.company} onChange={handleChange} placeholder="Company Name*" autoComplete="organization" disabled={status==="loading"} aria-invalid={!!errors.company} aria-describedby={describedBy("company")} className={inputClass}/><FieldError id="company-error">{errors.company}</FieldError></div>
      <div className="mt-3 grid grid-cols-[92px_1fr] gap-3"><div><label className="sr-only" htmlFor="countryCode">Country code</label><select id="countryCode" name="countryCode" value={formData.countryCode} onChange={handleChange} disabled={status==="loading"} className={inputClass}><option>+91</option><option>+1</option><option>+44</option><option>+971</option><option>+65</option></select></div><div><label className="sr-only" htmlFor="phone">Phone Number</label><input id="phone" name="phone" type="tel" inputMode="tel" value={formData.phone} onChange={handleChange} placeholder="Phone Number*" autoComplete="tel" disabled={status==="loading"} aria-invalid={!!errors.phone} aria-describedby={describedBy("phone")} className={inputClass}/><FieldError id="phone-error">{errors.phone}</FieldError></div></div>
      <div className="mt-3"><label className="sr-only" htmlFor="subject">Subject</label><input id="subject" name="subject" value={formData.subject} onChange={handleChange} placeholder="Subject*" disabled={status==="loading"} aria-invalid={!!errors.subject} aria-describedby={describedBy("subject")} className={inputClass}/><FieldError id="subject-error">{errors.subject}</FieldError></div>
      <div className="mt-3"><label className="sr-only" htmlFor="message">Message</label><textarea id="message" name="message" rows={4} value={formData.message} onChange={handleChange} placeholder={`${messagePlaceholder}*`} disabled={status==="loading"} aria-invalid={!!errors.message} aria-describedby={describedBy("message")} className={`${inputClass} resize-y py-3`}/><FieldError id="message-error">{errors.message}</FieldError></div>
      <div className="mt-3"><label className="flex items-start gap-2 text-[11px] leading-4 text-[var(--epr-muted)]"><input id="consent" name="consent" type="checkbox" checked={formData.consent} onChange={handleChange} disabled={status==="loading"} aria-invalid={!!errors.consent} aria-describedby={describedBy("consent")} className="mt-0.5 h-3.5 w-3.5 rounded border-[var(--epr-border)] accent-[var(--epr-green)]"/><span>I agree to the <Link href="/privacy-policy" className="font-semibold text-[var(--epr-green)]">Privacy Policy</Link> and <Link href="/terms-and-conditions" className="font-semibold text-[var(--epr-green)]">Terms &amp; Conditions</Link>.</span></label><FieldError id="consent-error">{errors.consent}</FieldError></div>
      {statusMessage?<div role={status==="success"?"status":"alert"} className={`mt-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] ${status==="success"?"border-green-200 bg-green-50 text-green-800":"border-red-200 bg-red-50 text-red-700"}`}>{status==="success"?<CheckCircle2 size={16}/>:null}{statusMessage}</div>:null}
      <button type="submit" disabled={status==="loading"} className="epr-button epr-button-primary mt-4">{status==="loading"?<><LoaderCircle size={15} className="animate-spin"/> Sending...</>:<>{submitLabel} <Send size={14}/></>}</button>
    </form>
  );
}
