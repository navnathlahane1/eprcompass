import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

describe('portal request path', () => {
  it('overwrites a spoofed bypass path upstream', () => {
    const response = proxy(new NextRequest('http://localhost/ops/dashboard', {
      headers: { 'x-pathname': '/ops/login' },
    }));
    expect(response.headers.get('x-middleware-request-x-pathname')).toBe('/ops/dashboard');
    expect(response.headers.get('x-middleware-override-headers')).toContain('x-pathname');
  });
  it('forwards real login paths', () => {
    const response = proxy(new NextRequest('http://localhost/iam/login'));
    expect(response.headers.get('x-middleware-request-x-pathname')).toBe('/iam/login');
  });
});
