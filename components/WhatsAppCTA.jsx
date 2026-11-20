"use client";

import { whatsappUrl } from "@/lib/whatsapp/cta";

/**
 * Reusable WhatsApp call-to-action. Renders an <a> that opens WhatsApp chat
 * with the standard number and an optional prefilled message. Keep styling by
 * passing `className`; content via children.
 */
export default function WhatsAppCTA({ message, className = "", children, ...rest }) {
  return (
    <a
      href={whatsappUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      {...rest}
    >
      {children}
    </a>
  );
}
