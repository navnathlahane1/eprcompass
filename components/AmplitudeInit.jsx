"use client";

import { useEffect } from "react";
import { initializeAmplitude, applyAnalyticsConsent, resetAnalyticsIdentity } from "@/lib/analytics";
import { CONSENT_EVENT, CONSENT_KEY } from '@/lib/analyticsPrivacy';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export default function AmplitudeInit() {
  useEffect(() => {
    void initializeAmplitude();
    const consentChanged = () => { void applyAnalyticsConsent(); };
    const storageChanged = (event) => { if (event.key === CONSENT_KEY) consentChanged(); };
    window.addEventListener(CONSENT_EVENT, consentChanged);
    window.addEventListener('storage', storageChanged);
    const subscription = isSupabaseConfigured ? supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') void resetAnalyticsIdentity();
    }).data.subscription : null;
    return () => {
      window.removeEventListener(CONSENT_EVENT, consentChanged);
      window.removeEventListener('storage', storageChanged);
      subscription?.unsubscribe();
    };
  }, []);

  return null;
}
