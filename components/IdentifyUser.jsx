"use client";

import { useEffect } from "react";
import { identifyUser } from "@/lib/analytics";
import { CONSENT_EVENT } from '@/lib/analyticsPrivacy';


/**
 * Ties Amplitude events in this browser session to the logged-in user.
 * Render once as a sibling inside each portal's authenticated layout,
 * passing the identity already resolved server-side for that request.
 */
/** @param {{userId: string, email?: string, role?: string, portal?: string, companyName?: string | null, workspaceId?: string}} props */
export default function IdentifyUser({ userId, role, portal, workspaceId }) {
  useEffect(() => {
    const identify = () => identifyUser({ userId, role, portal, workspaceId });
    identify();
    window.addEventListener(CONSENT_EVENT, identify);
    return () => window.removeEventListener(CONSENT_EVENT, identify);
  }, [userId, role, portal, workspaceId]);

  return null;
}
