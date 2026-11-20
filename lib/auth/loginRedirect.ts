export function safeLoginRedirect(value: string | null | undefined, fallback: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020%]/.test(value.split('?')[0])) return fallback;
  try {
    const url = new URL(value, 'https://portal.invalid');
    const prefix = fallback.split('/')[1];
    if (url.origin !== 'https://portal.invalid' || !url.pathname.startsWith(`/${prefix}/`)
      || /\/(login|logout|signout)\/?$/.test(url.pathname)) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return fallback; }
}
