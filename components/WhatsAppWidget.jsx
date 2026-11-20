"use client";

import { useState } from "react";
import { ArrowUpRight, MessageCircle, X } from "lucide-react";
import {
  SITE_CONTACT_WHATSAPP,
  SITE_CONTACT_WHATSAPP_DIGITS,
} from "@/lib/siteContact";

const WHATSAPP_MESSAGE = "Hi EPR Compass, I need help with EPR compliance.";
const WHATSAPP_URL = `https://wa.me/${SITE_CONTACT_WHATSAPP_DIGITS}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export default function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const [showTip, setShowTip] = useState(true);

  return (
    <div className="fixed bottom-5 right-4 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <section
          id="epr-compass-whatsapp-panel"
          role="dialog"
          aria-labelledby="epr-compass-whatsapp-title"
          className="w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
        >
          <div className="flex items-center justify-between bg-[#128c7e] px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15">
                <MessageCircle size={22} aria-hidden="true" />
              </span>
              <div>
                <h2 id="epr-compass-whatsapp-title" className="text-sm font-bold">
                  EPR Compass on WhatsApp
                </h2>
                <p className="mt-0.5 text-xs text-white/80">Chat with our team</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close WhatsApp chat panel"
              className="grid h-8 w-8 place-items-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-4 p-4">
            <div className="rounded-xl bg-[#f3f7f5] p-3.5">
              <p className="text-sm font-semibold text-[#28104f]">How can we help?</p>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                Message us about EPR compliance, filings, certificates, or the platform.
              </p>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#16875f] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#11734f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16875f] focus-visible:ring-offset-2"
            >
              <MessageCircle size={17} aria-hidden="true" />
              Continue to WhatsApp
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
            <p className="text-center text-xs text-slate-500">{SITE_CONTACT_WHATSAPP}</p>
          </div>
        </section>
      ) : (
        showTip && (
          <div className="flex max-w-[calc(100vw-5rem)] items-start gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-5 text-slate-700 shadow-lg shadow-slate-950/10 sm:max-w-[280px]">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="pr-1 hover:text-[#128c7e]">
              Need EPR help? <span className="font-semibold text-[#128c7e]">Chat with us on WhatsApp.</span>
            </a>
            <button
              type="button"
              onClick={() => setShowTip(false)}
              aria-label="Dismiss WhatsApp help message"
              className="-mr-1 -mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        )
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close WhatsApp chat panel" : "Open WhatsApp chat panel"}
        aria-expanded={open}
        aria-controls="epr-compass-whatsapp-panel"
        className={`grid h-14 w-14 place-items-center rounded-full text-white shadow-xl shadow-[#128c7e]/25 transition hover:scale-105 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#128c7e]/30 ${open ? "bg-[#28104f]" : "bg-[#128c7e] hover:bg-[#0f796d]"}`}
      >
        {open ? <X size={23} aria-hidden="true" /> : <MessageCircle size={25} aria-hidden="true" />}
      </button>
    </div>
  );
}
