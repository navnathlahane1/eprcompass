import { createHash, randomBytes } from 'crypto';

// ── Platform OAuth configurations ────────────────────────────

export interface OAuthConfig {
  authUrl:      string;
  tokenUrl:     string;
  scopes:       string[];
  clientId:     string | undefined;
  clientSecret: string | undefined;
  usePKCE?:     boolean;
  /** Meta uses GET for token exchange; others use POST */
  tokenMethod?: 'POST' | 'GET';
  /** Extra params added to auth URL */
  authExtras?:  Record<string, string>;
}

export const OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  linkedin: {
    authUrl:      'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl:     'https://www.linkedin.com/oauth/v2/accessToken',
    scopes:       ['r_organization_social', 'r_organization_admin', 'rw_organization_admin', 'w_organization_social'],
    clientId:     process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  },
  facebook: {
    authUrl:      'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl:     'https://graph.facebook.com/v19.0/oauth/access_token',
    scopes:       ['pages_read_engagement', 'pages_show_list', 'read_insights', 'pages_read_user_content'],
    clientId:     process.env.META_APP_ID,
    clientSecret: process.env.META_APP_SECRET,
    tokenMethod:  'GET',
  },
  instagram: {
    authUrl:      'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl:     'https://graph.facebook.com/v19.0/oauth/access_token',
    scopes:       ['instagram_basic', 'instagram_manage_insights', 'pages_read_engagement', 'pages_show_list'],
    clientId:     process.env.META_APP_ID,
    clientSecret: process.env.META_APP_SECRET,
    tokenMethod:  'GET',
  },
  twitter: {
    authUrl:      'https://twitter.com/i/oauth2/authorize',
    tokenUrl:     'https://api.twitter.com/2/oauth2/token',
    scopes:       ['tweet.read', 'users.read', 'offline.access'],
    clientId:     process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    usePKCE:      true,
  },
  youtube: {
    authUrl:      'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl:     'https://oauth2.googleapis.com/token',
    scopes:       [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
    ],
    clientId:     process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    authExtras:   { access_type: 'offline', prompt: 'consent' },
  },
};

// ── PKCE helpers ──────────────────────────────────────────────

export function generateCodeVerifier(): string {
  return randomBytes(48).toString('base64url').slice(0, 96);
}

export function generateCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

// ── Build authorization URL ───────────────────────────────────

export function buildAuthUrl(
  platform:     string,
  state:        string,
  redirectUri:  string,
  codeVerifier?: string,
): string {
  const cfg = OAUTH_CONFIGS[platform];
  if (!cfg) throw new Error(`No OAuth config for platform: ${platform}`);
  if (!cfg.clientId) throw new Error(`${platform.toUpperCase()}_CLIENT_ID not set`);

  const params: Record<string, string> = {
    response_type: 'code',
    client_id:     cfg.clientId,
    redirect_uri:  redirectUri,
    scope:         cfg.scopes.join(cfg.usePKCE ? ' ' : ' '),
    state,
    ...(cfg.authExtras ?? {}),
  };

  if (cfg.usePKCE && codeVerifier) {
    params.code_challenge        = generateCodeChallenge(codeVerifier);
    params.code_challenge_method = 'S256';
  }

  return `${cfg.authUrl}?${new URLSearchParams(params).toString()}`;
}

// ── Exchange authorization code for tokens ────────────────────

export interface TokenResponse {
  access_token:  string;
  refresh_token?: string;
  expires_in?:   number;
  token_type?:   string;
  scope?:        string;
}

export async function exchangeCode(
  platform:     string,
  code:         string,
  redirectUri:  string,
  codeVerifier?: string,
): Promise<TokenResponse> {
  const cfg = OAUTH_CONFIGS[platform];
  if (!cfg?.clientId || !cfg?.clientSecret) {
    throw new Error(`${platform} credentials not configured`);
  }

  const params: Record<string, string> = {
    grant_type:   'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id:    cfg.clientId,
  };

  if (cfg.usePKCE && codeVerifier) {
    params.code_verifier = codeVerifier;
  } else {
    params.client_secret = cfg.clientSecret;
  }

  let res: Response;
  if (cfg.tokenMethod === 'GET') {
    res = await fetch(`${cfg.tokenUrl}?${new URLSearchParams(params).toString()}`);
  } else {
    // For Twitter PKCE, auth header instead of client_secret in body
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (cfg.usePKCE) {
      headers['Authorization'] = `Basic ${Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64')}`;
      delete params.client_secret;
    }
    res = await fetch(cfg.tokenUrl, { method: 'POST', headers, body: new URLSearchParams(params).toString() });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<TokenResponse>;
}

// ── Refresh access token ──────────────────────────────────────

export async function refreshAccessToken(
  platform:     string,
  refreshToken: string,
): Promise<TokenResponse> {
  const cfg = OAUTH_CONFIGS[platform];
  if (!cfg?.clientId || !cfg?.clientSecret) {
    throw new Error(`${platform} credentials not configured`);
  }

  const params: Record<string, string> = {
    grant_type:    'refresh_token',
    refresh_token: refreshToken,
    client_id:     cfg.clientId,
  };

  const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };

  if (cfg.usePKCE) {
    headers['Authorization'] = `Basic ${Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64')}`;
  } else {
    params.client_secret = cfg.clientSecret;
  }

  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers,
    body: new URLSearchParams(params).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<TokenResponse>;
}

// ── Callback redirect URI builder ─────────────────────────────

export function callbackUri(platform: string, baseUrl: string): string {
  return `${baseUrl}/api/comms/connect/${platform}/callback`;
}

export const SUPPORTED_PLATFORMS = Object.keys(OAUTH_CONFIGS);
