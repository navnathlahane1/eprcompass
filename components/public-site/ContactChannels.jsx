import { Mail, MapPin, MessageCircle } from "lucide-react";
import {
  SITE_CONTACT_ADDRESS,
  SITE_CONTACT_EMAIL,
  SITE_CONTACT_WHATSAPP,
  SITE_CONTACT_WHATSAPP_DIGITS,
} from "@/lib/siteContact";

export default function ContactChannels({ className = "" }) {
  return (
    <address className={`not-italic ${className}`}>
      <a
        href={`mailto:${SITE_CONTACT_EMAIL}`}
        className="flex items-start gap-2 hover:text-[var(--epr-lime)]"
      >
        <Mail size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span className="break-all">{SITE_CONTACT_EMAIL}</span>
      </a>
      <a
        href={`https://wa.me/${SITE_CONTACT_WHATSAPP_DIGITS}`}
        target="_blank"
        rel="noreferrer"
        className="mt-3 flex items-start gap-2 hover:text-[var(--epr-lime)]"
      >
        <MessageCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>WhatsApp: {SITE_CONTACT_WHATSAPP}</span>
      </a>
      <span className="mt-3 flex items-start gap-2">
        <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>Address: {SITE_CONTACT_ADDRESS}</span>
      </span>
    </address>
  );
}
