import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildPasswordResetEmail, sendPasswordResetEmail } from './passwordResetEmail';

const originalResendKey = process.env.RESEND_API_KEY;

afterEach(() => {
  if (originalResendKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalResendKey;
  vi.unstubAllGlobals();
});

describe('IAM password reset email', () => {
  it('includes the secure recovery link and safety instructions', () => {
    const message = buildPasswordResetEmail({
      fullName: 'Reset User',
      resetUrl: 'https://auth.example.com/verify?token=secure-token&type=recovery',
    });

    expect(message.subject).toBe('Reset your EPR Compass password');
    expect(message.text).toContain('https://auth.example.com/verify?token=secure-token&type=recovery');
    expect(message.text).toContain('If you did not request this reset');
    expect(message.html).toContain('token=secure-token&amp;type=recovery');
  });

  it('escapes user-controlled content in the HTML message', () => {
    const message = buildPasswordResetEmail({
      fullName: '<Admin & User>',
      resetUrl: 'https://example.com/reset?next="portal"',
    });

    expect(message.html).toContain('&lt;Admin &amp; User&gt;');
    expect(message.html).toContain('next=&quot;portal&quot;');
    expect(message.html).not.toContain('<Admin & User>');
  });

  it('delivers through Resend with the supplied one-time idempotency key', async () => {
    process.env.RESEND_API_KEY = 'test-resend-key';
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendPasswordResetEmail({
      userId: 'user-123',
      email: 'user@example.com',
      fullName: 'Test User',
      resetUrl: 'https://auth.example.com/verify?token=one-time-token&type=recovery',
      idempotencyKey: 'iam-password-reset-user-123-token-hash',
    });

    expect(result.sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer test-resend-key',
        'Idempotency-Key': 'iam-password-reset-user-123-token-hash',
      }),
    }));
    const requestBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(requestBody.to).toEqual(['user@example.com']);
    expect(requestBody.html).toContain('token=one-time-token&amp;type=recovery');
  });
});

