import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/auth/SimpleLoginForm', () => ({ default: () => React.createElement('p', null, 'Sign in form') }));
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => React.createElement('a', { href }, children) }));

import IntelLoginPage from '@/app/intel/login/page';
import AcademyLoginPage from '@/app/academy/login/page';

describe('public portal entry states', () => {
  it('renders denied Intel access and recovery navigation before client hydration', async () => {
    const html = renderToStaticMarkup(await IntelLoginPage({ searchParams: Promise.resolve({ intelError: 'denied' }) }));
    expect(html).toContain('Intel access denied');
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/login"');
    expect(html).toContain('Sign in form');
  });
  it('offers a CEPC access request with the selected training programme', async () => {
    const html = renderToStaticMarkup(await AcademyLoginPage({ searchParams: Promise.resolve({ program: 'tier-2' }) }));
    expect(html).toContain('Certified EPR Professional (CEPC)');
    expect(html).toContain('/contact?intent=academy&amp;program=tier-2');
    expect(html).toContain('does not automatically enrol');
  });
  it('does not propagate arbitrary programme input to the access request', async () => {
    const html = renderToStaticMarkup(await AcademyLoginPage({ searchParams: Promise.resolve({ program: 'unrecognized' }) }));
    expect(html).toContain('href="/contact?intent=academy"');
    expect(html).not.toContain('unrecognized');
  });
});
