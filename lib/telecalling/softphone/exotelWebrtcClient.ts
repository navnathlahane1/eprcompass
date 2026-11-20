import type { SipAccountInfo, SoftphoneCallHandle, SoftphoneClient, SoftphoneStatus } from './types';

/**
 * Stub implementation, pending real Exotel Web Client SDK integration.
 *
 * Exotel's browser-calling SDK (`webrtc-client-sdk`) requires their
 * integration guide (gated behind an account rep) to get the exact
 * init/register/dial call signatures, plus a Unified License add-on and a
 * provisioned SIP identity per agent — none of which exist yet. Rather than
 * guess at an API surface we can't verify, this stub implements the same
 * SoftphoneClient interface the real SDK wrapper will, so the rest of the
 * app (context, widget, call button) can be built and tested now. Swap this
 * file's internals for the real SDK calls once Exotel's docs + a test
 * agent's SIP credentials are in hand — nothing else should need to change.
 */
export function createExotelWebrtcClient(): SoftphoneClient {
  let status: SoftphoneStatus = 'UNCONFIGURED';
  const listeners = new Set<(s: SoftphoneStatus) => void>();

  function setStatus(next: SoftphoneStatus) {
    status = next;
    listeners.forEach((cb) => cb(status));
  }

  return {
    async register(_account: SipAccountInfo) {
      setStatus('REGISTERING');
      throw new Error(
        'Exotel WebRTC SDK is not yet integrated. Ask your Exotel account rep for the Web Client SDK integration guide and a test agent SIP identity, then wire it up in exotelWebrtcClient.ts.'
      );
    },

    async unregister() {
      setStatus('UNCONFIGURED');
    },

    async dial(_toNumber: string, _leadId: string | null): Promise<SoftphoneCallHandle> {
      throw new Error('Softphone is not registered — cannot place a call yet.');
    },

    async hangup() {
      setStatus('READY');
    },

    onStatusChange(cb: (status: SoftphoneStatus) => void) {
      listeners.add(cb);
      cb(status);
      return () => listeners.delete(cb);
    },
  };
}
