export type PasswordResetEmailResult = {
  sent: boolean;
  reason: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function buildPasswordResetEmail(args: {
  fullName?: string | null;
  resetUrl: string;
}) {
  const displayName = args.fullName?.trim() || 'User';
  const safeName = escapeHtml(displayName);
  const safeResetUrl = escapeHtml(args.resetUrl);
  const subject = 'Reset your EPR Compass password';
  const text = [
    `Hello ${displayName},`,
    '',
    'A password reset was requested for your EPR Compass account.',
    `Reset your password: ${args.resetUrl}`,
    '',
    'If you did not request this reset, you can safely ignore this email. Your password will remain unchanged.',
    'For security, do not share this link with anyone.',
    '',
    'Regards,',
    'EPR Compass Team',
  ].join('\n');

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
    <div style="max-width:600px;margin:0 auto;padding:32px 16px">
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
        <div style="background:#0f172a;padding:24px 28px">
          <div style="font-size:20px;font-weight:700;color:#ffffff">EPR Compass</div>
          <div style="margin-top:4px;font-size:13px;color:#5eead4">Compliance Platform</div>
        </div>
        <div style="padding:28px">
          <h1 style="margin:0 0 14px;font-size:22px;color:#0f172a">Reset your password</h1>
          <p style="margin:0 0 20px;line-height:1.6;color:#475569">Hello ${safeName}, a password reset was requested for your EPR Compass account.</p>
          <a href="${safeResetUrl}" style="display:inline-block;padding:12px 20px;border-radius:9px;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:700">Reset password</a>
          <div style="margin-top:24px;padding:16px;border-left:4px solid #f59e0b;background:#fffbeb;color:#78350f;line-height:1.55">
            If you did not request this reset, you can safely ignore this email. Your password will remain unchanged.
          </div>
          <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#64748b">For security, do not share this password reset link with anyone.</p>
        </div>
      </div>
      <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#94a3b8">EPR Compass · EPR Compass</p>
    </div>
  </body>
</html>`;

  return { subject, text, html };
}

export async function sendPasswordResetEmail(args: {
  userId: string;
  email: string;
  fullName?: string | null;
  resetUrl: string;
  idempotencyKey: string;
}): Promise<PasswordResetEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: 'Password reset email sending is not configured.' };

  const emailContent = buildPasswordResetEmail(args);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Idempotency-Key': args.idempotencyKey,
      },
      body: JSON.stringify({
        from: process.env.IAM_FROM_EMAIL || process.env.RENEWAL_FROM_EMAIL || 'EPR Compass <support@example.com>',
        to: [args.email],
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      }),
    });

    if (!response.ok) {
      console.error('IAM password reset email provider error', { status: response.status, userId: args.userId });
      return { sent: false, reason: 'The email provider rejected the password reset message.' };
    }

    return { sent: true, reason: '' };
  } catch (error) {
    console.error('IAM password reset email request failed', {
      userId: args.userId,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return { sent: false, reason: 'The email service could not be reached.' };
  }
}

