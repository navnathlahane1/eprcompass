// Existing seeded test accounts only. Never runs the seeder or changes passwords.
// Run with a local EPR Compass server and NEXT_PUBLIC_SUPABASE_* variables configured.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = ts.createSourceFile('seed.js', fs.readFileSync(path.join(root, 'supabase/seed.js'), 'utf8'), ts.ScriptTarget.Latest, true);
const accounts = [];
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'users' && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
    for (const entry of node.initializer.properties) {
      if (!entry.initializer || !ts.isObjectLiteralExpression(entry.initializer)) continue;
      const fields = Object.fromEntries(entry.initializer.properties
        .filter(field => field.initializer && ts.isStringLiteral(field.initializer))
        .map(field => [field.name.getText(source), field.initializer.text]));
      if (fields.email?.endsWith('.test') && fields.password) accounts.push(fields);
    }
  }
  ts.forEachChild(node, visit);
}
visit(source);

const api = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const origin = process.env.LOGIN_TEST_ORIGIN || 'http://127.0.0.1:3210';
if (!api || !key) throw new Error('Configure the Supabase URL and public key');
if (!['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)) throw new Error('The test origin must be localhost');

const expected = { client: '/portal/dashboard', recycler: '/recycler-portal/dashboard', manager: '/admin/dashboard', partner: '/partner/dashboard', cepc: '/cepc/dashboard' };
const loginPages = { client: '/portal/login', recycler: '/recycler-portal/login', manager: '/admin/login', partner: '/partner/login', cepc: '/cepc/login' };
const results = [];
const roleIndices = new Map();
const unauthenticated = await fetch(`${origin}/api/auth/destination`, { signal: AbortSignal.timeout(120000) });
results.push({ scenario: 'missing session', pass: unauthenticated.status === 401, status: unauthenticated.status });
const invalid = await fetch(`${origin}/api/auth/destination`, { headers: { cookie: 'sb-access-token=invalid-test-token' }, signal: AbortSignal.timeout(30000) });
results.push({ scenario: 'invalid session', pass: invalid.status === 401, status: invalid.status });

for (const account of accounts) {
  const roleIndex = (roleIndices.get(account.role) ?? 0) + 1;
  roleIndices.set(account.role, roleIndex);
  const accountLabel = `${account.role}#${roleIndex}`;
  try {
    // Exactly one attempt with the password documented for this test account.
    const login = await fetch(`${api}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: account.email, password: account.password }),
      signal: AbortSignal.timeout(20000),
    });
    const session = await login.json();
    if (!login.ok || !session.access_token) {
      results.push({ account: accountLabel, phase: 'password sign-in', pass: false, status: login.status, code: session.error_code ?? session.code });
      continue;
    }
    const sessionRole = await fetch(`${origin}/api/auth/session-role`, {
      headers: { authorization: `Bearer ${session.access_token}` }, signal: AbortSignal.timeout(30000),
    });
    const sessionRoleValue = await sessionRole.json();
    results.push({ account: accountLabel, phase: 'session role', pass: sessionRole.ok && sessionRoleValue.role === account.role, status: sessionRole.status });

    const cookie = `sb-access-token=${session.access_token}`;
    const response = await fetch(`${origin}/api/auth/destination`, {
      headers: { cookie }, signal: AbortSignal.timeout(30000),
    });
    const value = await response.json();
    const destinationPass = response.ok && value.destination === expected[account.role];
    results.push({ account: accountLabel, phase: 'authenticated destination', pass: destinationPass, status: response.status, destination: value.destination });

    if (destinationPass) {
      const loginPage = await fetch(`${origin}${loginPages[account.role]}`, { signal: AbortSignal.timeout(30000) });
      results.push({ account: accountLabel, phase: 'login page renders', pass: loginPage.ok, status: loginPage.status });

      const dashboard = await fetch(`${origin}${value.destination}`, {
        headers: { cookie }, redirect: 'manual', signal: AbortSignal.timeout(60000),
      });
      results.push({ account: accountLabel, phase: 'dashboard access', pass: dashboard.status === 200, status: dashboard.status });

      if (account.role === 'client' || account.role === 'recycler') {
        const otherDashboard = account.role === 'client' ? '/recycler-portal/dashboard' : '/portal/dashboard';
        const wrongRoleResponse = await fetch(`${origin}${otherDashboard}`, {
          headers: { cookie }, redirect: 'manual', signal: AbortSignal.timeout(60000),
        });
        const location = wrongRoleResponse.headers.get('location') ?? '';
        // Next.js may encode a Server Component redirect as a streamed meta
        // refresh while retaining HTTP 200, so status alone is insufficient.
        const wrongRoleBody = wrongRoleResponse.status === 200 ? await wrongRoleResponse.text() : '';
        const streamedLoginRedirect = /http-equiv=["']refresh["'][^>]*content=["'][^"']*(?:portal|recycler-portal)\/login/i.test(wrongRoleBody)
          || /content=["'][^"']*(?:portal|recycler-portal)\/login[^"']*["'][^>]*http-equiv=["']refresh["']/i.test(wrongRoleBody);
        results.push({
          account: accountLabel,
          phase: 'cross-role dashboard denied',
          pass: ([301, 302, 303, 307, 308].includes(wrongRoleResponse.status) && /login/.test(location)) || streamedLoginRedirect,
          status: wrongRoleResponse.status,
          redirectedToLogin: /login/.test(location) || streamedLoginRedirect,
        });
      }
    }
    // Do not perform a global sign-out: other sessions belong to the user.
    // Tokens remain only in process memory and are never logged or persisted.
  } catch (error) {
    results.push({ email: account.email, role: account.role, pass: false, error: error.name });
  }
}
console.log(JSON.stringify({ accounts: accounts.length, results }, null, 2));
if (results.some(result => !result.pass)) process.exitCode = 1;

