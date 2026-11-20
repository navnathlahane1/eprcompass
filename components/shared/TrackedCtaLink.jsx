"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLeadAttribution, trackLeadEvent } from "@/lib/leadTracking";

export default function TrackedCtaLink({
  href,
  className,
  children,
  eventName = "cta_clicked",
  eventPayload = {},
  onClick,
  ...rest
}) {
  const pathname = usePathname();

  const handleClick = (event) => {
    if (typeof onClick === "function") {
      onClick(event);
    }

    const payload = {
      page_path: pathname || null,
      ...getLeadAttribution(pathname),
      ...eventPayload,
    };

    trackLeadEvent(eventName, payload);

    if (eventName === "industry_cta_clicked") {
      fetch("/api/analytics/leads/cta-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Keep navigation non-blocking even if tracking endpoint fails.
      });
    }
  };

  return (
    <Link href={href} className={className} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
