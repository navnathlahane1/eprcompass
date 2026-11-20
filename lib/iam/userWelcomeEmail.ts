type PortalAccess = {
  portalName: string;
  loginPath: string;
  roleLabel: string;
};

export type WelcomeEmailResult = {
  sent: boolean;
  reason: string;
};

const PORTAL_ACCESS: Record<string, PortalAccess> = {
  client: { portalName: 'EPR Portal', loginPath: '/portal/login', roleLabel: 'EPR Client' },
  partner: { portalName: 'Partner Portal', loginPath: '/partner/login', roleLabel: 'Partner' },
  cepc: { portalName: 'CEPC Portal', loginPath: '/cepc/login', roleLabel: 'CEPC Consultant' },
  recycler: { portalName: 'Recycler Portal', loginPath: '/recycler-portal/login', roleLabel: 'Recycler' },
  legal: { portalName: 'Legal Portal', loginPath: '/legal-portal/login', roleLabel: 'Legal Verifier' },
  compliance_manager: { portalName: 'Legal Portal', loginPath: '/legal-portal/login', roleLabel: 'Compliance Manager' },
  tendering_manager: { portalName: 'Tendering Portal', loginPath: '/tendering/login', roleLabel: 'Tendering Manager' },
  tendering_executive: { portalName: 'Tendering Portal', loginPath: '/tendering/login', roleLabel: 'Tendering Executive' },
  telecaller: { portalName: 'Telecalling Portal', loginPath: '/telecalling/login', roleLabel: 'Telecaller' },
  tc_team_lead: { portalName: 'Telecalling Portal', loginPath: '/telecalling/login', roleLabel: 'TC Team Lead' },
  tc_senior_agent: { portalName: 'Telecalling Portal', loginPath: '/telecalling/login', roleLabel: 'TC Senior Agent' },
  tc_quality_analyst: { portalName: 'Telecalling Portal', loginPath: '/telecalling/login', roleLabel: 'TC Quality Analyst' },
  tc_campaign_manager: { portalName: 'Telecalling Portal', loginPath: '/telecalling/login', roleLabel: 'TC Campaign Manager' },
  tc_trainer: { portalName: 'Telecalling Portal', loginPath: '/telecalling/login', roleLabel: 'TC Trainer' },
  'sales-executive': { portalName: 'Admin Panel', loginPath: '/admin/login', roleLabel: 'Sales Executive' },
  manager: { portalName: 'Admin Panel', loginPath: '/admin/login', roleLabel: 'Manager' },
  user_manager: { portalName: 'Access Manager', loginPath: '/iam/login', roleLabel: 'Access Manager' },
  task_manager: { portalName: 'Task Manager', loginPath: '/taskmanager/login', roleLabel: 'Task Manager' },
  cfo: { portalName: 'Finance Portal', loginPath: '/finance/login', roleLabel: 'Finance — CFO' },
  finance_executive: { portalName: 'Finance Portal', loginPath: '/finance/login', roleLabel: 'Finance Executive' },
  academy_director: { portalName: 'Academy Portal', loginPath: '/academy/login', roleLabel: 'Academy Director' },
  academy_manager: { portalName: 'Academy Portal', loginPath: '/academy/login', roleLabel: 'Academy Manager' },
  training_program_manager: { portalName: 'Academy Portal', loginPath: '/academy/login', roleLabel: 'Program Manager' },
  trainer: { portalName: 'Academy Portal', loginPath: '/academy/login', roleLabel: 'Trainer' },
  guest_trainer: { portalName: 'Academy Portal', loginPath: '/academy/login', roleLabel: 'Guest Trainer' },
  partner_trainer: { portalName: 'Academy Portal', loginPath: '/academy/login', roleLabel: 'Partner Trainer' },
  learner: { portalName: 'Academy Portal', loginPath: '/academy/login', roleLabel: 'Learner' },
  lead_gen_executive: { portalName: 'Operations Portal', loginPath: '/ops/login', roleLabel: 'Lead Generation Executive' },
  appointment_setter: { portalName: 'Operations Portal', loginPath: '/ops/login', roleLabel: 'Appointment Setter' },
  crm_data_executive: { portalName: 'Operations Portal', loginPath: '/ops/login', roleLabel: 'CRM Data Executive' },
  customer_support_executive: { portalName: 'Operations Portal', loginPath: '/ops/login', roleLabel: 'Customer Support Executive' },
  virtual_assistant: { portalName: 'Operations Portal', loginPath: '/ops/login', roleLabel: 'Virtual Assistant' },
  proposal_executive: { portalName: 'Operations Portal', loginPath: '/ops/login', roleLabel: 'Proposal Executive' },
  compliance_doc_executive: { portalName: 'Operations Portal', loginPath: '/ops/login', roleLabel: 'Compliance Documentation Executive' },
  market_research_executive: { portalName: 'Operations Portal', loginPath: '/ops/login', roleLabel: 'Market Research Executive' },
  mis_reporting_executive: { portalName: 'Operations Portal', loginPath: '/ops/login', roleLabel: 'MIS & Reporting Executive' },
  viewer: { portalName: 'EPR Compass Platform', loginPath: '/login', roleLabel: 'Viewer' },
};

const COMMS_ROLES = new Set([
  'comms_cmo', 'comms_brand_manager', 'comms_regional_manager', 'comms_campaign_manager',
  'comms_social_media_manager', 'comms_content_strategist', 'comms_content_creator',
  'comms_graphic_designer', 'comms_community_manager', 'comms_performance_specialist',
  'comms_pr_manager', 'comms_influencer_manager', 'comms_marketing_analyst',
  'comms_marketing_ops', 'comms_marketing_intern',
]);

const KNOWLEDGE_ROLES = new Set([
  'knowledge_admin', 'knowledge_manager', 'knowledge_contributor', 'knowledge_viewer',
]);

function titleCaseRole(role: string): string {
  return role
    .split('_')
    .map(word => word ? `${word[0].toUpperCase()}${word.slice(1)}` : word)
    .join(' ');
}

export function getPortalAccess(role: string): PortalAccess {
  if (PORTAL_ACCESS[role]) return PORTAL_ACCESS[role];
  if (COMMS_ROLES.has(role)) {
    return { portalName: 'Comms Portal', loginPath: '/comms/login', roleLabel: titleCaseRole(role.replace('comms_', '')) };
  }
  if (KNOWLEDGE_ROLES.has(role)) {
    return { portalName: 'Knowledge Hub', loginPath: '/knowledge/login', roleLabel: titleCaseRole(role) };
  }
  return { portalName: 'EPR Compass Platform', loginPath: '/login', roleLabel: titleCaseRole(role) };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function buildWelcomeEmail(args: {
  email: string;
  password: string;
  role: string;
  fullName?: string | null;
  siteUrl: string;
}) {
  const access = getPortalAccess(args.role);
  const baseUrl = args.siteUrl.replace(/\/$/, '');
  const loginUrl = `${baseUrl}${access.loginPath}`;
  const displayName = args.fullName?.trim() || 'User';
  const safeName = escapeHtml(displayName);
  const safePortal = escapeHtml(access.portalName);
  const safeRole = escapeHtml(access.roleLabel);
  const safeEmail = escapeHtml(args.email);
  const safePassword = escapeHtml(args.password);
  const safeLoginUrl = escapeHtml(loginUrl);

  const subject = `Your ${access.portalName} login credentials`;
  const text = [
    `Hello ${displayName},`,
    '',
    `Your ${access.portalName} account has been created successfully.`,
    `Access role: ${access.roleLabel}`,
    '',
    `Portal link: ${loginUrl}`,
    `User ID: ${args.email}`,
    `Temporary password: ${args.password}`,
    '',
    'Please log in using these credentials. On your first login, you will be asked to change your password before accessing the portal.',
    'For security, do not share your credentials with anyone.',
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
          <h1 style="margin:0 0 14px;font-size:22px;color:#0f172a">Welcome to ${safePortal}</h1>
          <p style="margin:0 0 18px;line-height:1.6;color:#475569">Hello ${safeName}, your portal account has been created successfully.</p>
          <div style="margin:0 0 22px;padding:18px;border:1px solid #ddd6fe;border-radius:12px;background:#f5f3ff">
            <div style="margin-bottom:12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#7c3aed">Login credentials</div>
            <div style="margin:7px 0;color:#475569"><strong style="color:#0f172a">Portal:</strong> ${safePortal}</div>
            <div style="margin:7px 0;color:#475569"><strong style="color:#0f172a">Access role:</strong> ${safeRole}</div>
            <div style="margin:7px 0;color:#475569"><strong style="color:#0f172a">User ID:</strong> ${safeEmail}</div>
            <div style="margin:7px 0;color:#475569"><strong style="color:#0f172a">Temporary password:</strong> <code style="padding:3px 7px;border-radius:5px;background:#e2e8f0;color:#0f172a">${safePassword}</code></div>
          </div>
          <a href="${safeLoginUrl}" style="display:inline-block;padding:12px 20px;border-radius:9px;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:700">Log in to ${safePortal}</a>
          <div style="margin-top:24px;padding:16px;border-left:4px solid #f59e0b;background:#fffbeb;color:#78350f;line-height:1.55">
            <strong>First login:</strong> You will be asked to change your temporary password before accessing the portal. Choose a secure password that you have not used elsewhere.
          </div>
          <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#64748b">For security, do not share this email or your login credentials with anyone.</p>
        </div>
      </div>
      <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#94a3b8">EPR Compass · EPR Compass</p>
    </div>
  </body>
</html>`;

  return { ...access, loginUrl, subject, text, html };
}

export async function sendUserWelcomeEmail(args: {
  userId: string;
  email: string;
  password: string;
  role: string;
  fullName?: string | null;
}): Promise<WelcomeEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: 'Email sending is not configured.' };

  // Credential emails must always point users to the public portal, even when
  // the account is provisioned from a locally running IAM instance.
  const siteUrl = process.env.IAM_PORTAL_BASE_URL || 'http://localhost:3000';
  const emailContent = buildWelcomeEmail({ ...args, siteUrl });

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Idempotency-Key': `iam-welcome-${args.userId}`,
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
      console.error('IAM welcome email provider error', { status: response.status, userId: args.userId });
      return { sent: false, reason: 'The email provider rejected the message.' };
    }

    return { sent: true, reason: '' };
  } catch (error) {
    console.error('IAM welcome email request failed', {
      userId: args.userId,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return { sent: false, reason: 'The email service could not be reached.' };
  }
}

