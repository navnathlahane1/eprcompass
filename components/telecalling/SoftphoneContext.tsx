'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createExotelWebrtcClient } from '@/lib/telecalling/softphone/exotelWebrtcClient';
import type { SoftphoneClient, SoftphoneStatus } from '@/lib/telecalling/softphone/types';

interface ActiveCall {
  toNumber: string;
  leadId: string | null;
  startedAt: number;
}

interface SoftphoneContextValue {
  status: SoftphoneStatus;
  error: string | null;
  activeCall: ActiveCall | null;
  dial: (toNumber: string, leadId: string | null) => Promise<void>;
  hangup: () => Promise<void>;
}

const SoftphoneContext = createContext<SoftphoneContextValue | null>(null);

export function SoftphoneProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<SoftphoneClient | null>(null);
  const [status, setStatus] = useState<SoftphoneStatus>('UNCONFIGURED');
  const [error, setError] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);

  useEffect(() => {
    const client = createExotelWebrtcClient();
    clientRef.current = client;
    const unsubscribe = client.onStatusChange(setStatus);

    (async () => {
      try {
        const res = await fetch('/api/admin/telecalling/webrtc/token');
        const data = await res.json();
        if (!res.ok || !data.configured) return; // stays UNCONFIGURED — no SIP identity provisioned for this agent yet
        await client.register(data.account);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize softphone');
      }
    })();

    return () => { unsubscribe(); client.unregister().catch(() => {}); };
  }, []);

  const dial = useCallback(async (toNumber: string, leadId: string | null) => {
    if (!clientRef.current) return;
    setError(null);
    try {
      await clientRef.current.dial(toNumber, leadId);
      setActiveCall({ toNumber, leadId, startedAt: Date.now() });
    } catch (err: any) {
      setError(err.message || 'Could not place call');
    }
  }, []);

  const hangup = useCallback(async () => {
    if (!clientRef.current) return;
    await clientRef.current.hangup();
    setActiveCall(null);
  }, []);

  return (
    <SoftphoneContext.Provider value={{ status, error, activeCall, dial, hangup }}>
      {children}
    </SoftphoneContext.Provider>
  );
}

export function useSoftphone() {
  const ctx = useContext(SoftphoneContext);
  if (!ctx) throw new Error('useSoftphone must be used within a SoftphoneProvider');
  return ctx;
}
