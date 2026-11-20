export type SoftphoneStatus =
  | 'UNCONFIGURED'   // agent has no SIP credentials yet
  | 'REGISTERING'
  | 'READY'          // registered, idle, can place a call
  | 'CALLING'        // dialing / ringing
  | 'ON_CALL'
  | 'ERROR';

export interface SipAccountInfo {
  username: string;
  password: string;
  domain: string;
}

export interface SoftphoneCallHandle {
  callSid: string | null;
  toNumber: string;
  leadId: string | null;
}

/**
 * Adapter boundary between our UI and whichever telephony SDK backs it.
 * Implemented today by a stub (see exotelWebrtcClient.ts) because wiring the
 * real Exotel Web Client SDK needs their integration guide + a provisioned
 * SIP identity, neither of which exists yet. Swap the stub's internals once
 * those are in hand — nothing above this interface should need to change.
 */
export interface SoftphoneClient {
  register(account: SipAccountInfo): Promise<void>;
  unregister(): Promise<void>;
  dial(toNumber: string, leadId: string | null): Promise<SoftphoneCallHandle>;
  hangup(): Promise<void>;
  onStatusChange(cb: (status: SoftphoneStatus) => void): () => void;
}
