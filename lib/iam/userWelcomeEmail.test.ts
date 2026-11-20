import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildWelcomeEmail, getPortalAccess, sendUserWelcomeEmail } from './userWelcomeEmail';

const originalResendKey = process.env.RESEND_API_KEY;
const originalPublicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const originalIamPortalBaseUrl = process.env.IAM_PORTAL_BASE_URL;

afterEach(() => {
  if (originalResendKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalResendKey;
  if (originalPublicSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalPublicSiteUrl;
  if (originalIamPortalBaseUrl === undefined) delete process.env.IAM_PORTAL_BASE_URL;
  else process.env.IAM_PORTAL_BASE_URL = originalIamPortalBaseUrl;
  vi.unstubAllGlobals();
});

describe('IAM user welcome email', () => {
  it('maps roles to their dedicated portal login', () => {
    expect(getPortalAccess('client')).toMatchObject({
      portalName: 'EPR Portal',
      loginPath: '/portal/login',
    });
    expect(getPortalAccess('recycler')).toMatchObject({
      portalName: 'Recycler Portal',
      loginPath: '/recycler-portal/login',
    });
    expect(getPortalAccess('knowledge_manager')).toMatchObject({
      portalName: 'Knowledge Hub',
      loginPath: '/knowledge/login',
    });
    expect(getPortalAccess('comms_content_creator')).toMatchObject({
      portalName: 'Comms Portal',
      loginPath: '/comms/login',
    });
  });

  it('includes the credentials and first-login instructions', () => {
    const message = buildWelcomeEmail({
      email: 'new.user@example.com',
      password: 'Temp<Password>&1',
      role: 'academy_manager',
      fullName: 'New User',
      siteUrl: 'http://localhost:3000/',
    });

    expect(message.loginUrl).toBe('http://localhost:3000/academy/login');
    expect(message.subject).toBe('Your Academy Portal login credentials');
    expect(message.text).toContain('User ID: new.user@example.com');
    expect(message.text).toContain('Temporary password: Temp<Password>&1');
    expect(message.text).toContain('On your first login, you will be asked to change your password');
    expect(message.html).toContain('Temp&lt;Password&gt;&amp;1');
    expect(message.html).not.toContain('<code style="padding:3px 7px;border-radius:5px;background:#e2e8f0;color:#0f172a">Temp<Password>&1</code>');
  });

  it('uses the production portal URL even when the app is running locally', async () => {
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    delete process.env.IAM_PORTAL_BASE_URL;

    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendUserWelcomeEmail({
      userId: 'user-123',
      email: 'telecaller@example.com',
      password: 'Temporary@123',
      role: 'telecaller',
      fullName: 'Test Telecaller',
    });

    expect(result.sent).toBe(true);
    const requestBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(requestBody.html).toContain('http://localhost:3000/telecalling/login');
    expect(requestBody.text).toContain('Portal link: http://localhost:3000/telecalling/login');
    expect(requestBody.html).not.toContain('localhost');
  });
});
