"use client";

import { meetingRequestHref } from "@/lib/meetingRequest";
import { trackEvent } from "@/lib/analytics";

// Route consultation requests through the shared details form.
export default function ConsultationTriggerButton({
  label,
  className = "",
  source = "consultation_cta",
}) {
  return (
    <a
      href={meetingRequestHref(source)}
      className={className}
      onClick={() => trackEvent("Consultation CTA Clicked", { source })}
    >
      {label}
    </a>
  );
}
