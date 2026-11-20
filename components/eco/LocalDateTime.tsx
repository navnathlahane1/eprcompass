'use client';

import { useMemo } from 'react';

interface LocalDateTimeProps {
  value: string;
  locale?: string;
}

/**
 * Renders timestamps using the browser timezone for user-local display.
 */
export function LocalDateTime({ value, locale = 'en-IN' }: LocalDateTimeProps) {
  const label = useMemo(() => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }).format(date);
  }, [locale, value]);

  return <time dateTime={value}>{label}</time>;
}
