import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const { sdk } = vi.hoisted(() => ({ sdk: { initAll: vi.fn(), track: vi.fn(), reset: vi.fn(), setOptOut: vi.fn() } }));
vi.mock('@amplitude/unified', () => sdk);
import { initializeAmplitude, applyAnalyticsConsent, trackEvent, resetAnalyticsIdentity } from './analytics';
let consent: string | null;
beforeEach(() => {
  vi.clearAllMocks(); consent = null;
  vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', 'test');
  vi.stubGlobal('window', { localStorage: { getItem: () => consent } });
  sdk.initAll.mockResolvedValue(undefined);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it('does not initialize analytics before explicit consent', async () => {
  expect(await initializeAmplitude()).toBeNull(); expect(sdk.initAll).not.toHaveBeenCalled();
});
it('disables automatic sensitive capture and replay after consent', async () => {
  consent='granted'; await initializeAmplitude();
  expect(sdk.initAll).toHaveBeenCalledWith('test', expect.objectContaining({ analytics: {fetchRemoteConfig:false,autocapture:false}, sessionReplay:{sampleRate:0} }));
});
it('stops tracking and resets identity when consent is revoked', async () => {
  consent='granted'; await initializeAmplitude(); consent='denied'; await applyAnalyticsConsent();
  trackEvent('Test', {status:'pending'}); await Promise.resolve();
  expect(sdk.setOptOut).toHaveBeenCalledWith(true); expect(sdk.reset).toHaveBeenCalled(); expect(sdk.track).not.toHaveBeenCalled();
});
it('resets identity on logout', async () => {
  consent='granted'; await initializeAmplitude(); await resetAnalyticsIdentity(); expect(sdk.reset).toHaveBeenCalledOnce();
});
