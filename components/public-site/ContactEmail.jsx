"use client";

import { SITE_CONTACT_EMAIL } from "@/lib/siteContact";

export default function ContactEmail({ className = "", children = SITE_CONTACT_EMAIL }) {
  return (
    <a href={`mailto:${SITE_CONTACT_EMAIL}`} className={className}>
      {children}
    </a>
  );
}
