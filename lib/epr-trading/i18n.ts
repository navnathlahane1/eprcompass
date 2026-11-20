// [MODULE] Global Market Readiness
// [PURPOSE] Provides EN/HI/AR translation scaffold and RTL helpers for trading UI.
// [DEPENDENCIES] none

type Locale = 'en' | 'hi' | 'ar';

type Dictionary = Record<string, string>;

const dictionaries: Record<Locale, Dictionary> = {
  en: {
    'trading.title': 'EPR Credit Trading Desk',
    'trading.orderBook': 'Order Book',
    'trading.negotiation': 'Negotiation Room',
    'trading.instantMatch': 'Instant Match',
    'trading.marketAlerts': 'Market Alerts'
  },
  hi: {
    'trading.title': 'ईपीआर क्रेडिट ट्रेडिंग डेस्क',
    'trading.orderBook': 'ऑर्डर बुक',
    'trading.negotiation': 'नेगोशिएशन रूम',
    'trading.instantMatch': 'इंस्टेंट मैच',
    'trading.marketAlerts': 'मार्केट अलर्ट'
  },
  ar: {
    'trading.title': 'منصة تداول ائتمان مسؤولية المنتج الممتدة',
    'trading.orderBook': 'دفتر الأوامر',
    'trading.negotiation': 'غرفة التفاوض',
    'trading.instantMatch': 'مطابقة فورية',
    'trading.marketAlerts': 'تنبيهات السوق'
  }
};

export function t(key: string, locale: Locale = 'en') {
  return dictionaries[locale]?.[key] || dictionaries.en[key] || key;
}

export function getDirection(locale: Locale) {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function formatCurrency(value: number, currency: 'INR' | 'AED' | 'USD', locale: Locale = 'en') {
  return new Intl.NumberFormat(locale === 'hi' ? 'hi-IN' : locale === 'ar' ? 'ar-AE' : 'en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDateTime(value: string, locale: Locale = 'en', timeZone?: string) {
  return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : locale === 'ar' ? 'ar-AE' : 'en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
  }).format(new Date(value));
}

// TODO: replace static dictionaries with lazy-loaded translation bundles.
