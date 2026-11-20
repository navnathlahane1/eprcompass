// Named validators referenced in global_field_definitions.validation_function

export interface ValidationResult {
  valid: boolean;
  error?: string;
  formatted?: string; // Normalized value (if applicable)
}

// GSTIN: 15 chars — 2-digit state + 10-char PAN + entity number + check char
export function validate_gstin(value: string): ValidationResult {
  const v = value.trim().toUpperCase();
  if (!v) return { valid: false, error: 'GSTIN is required' };
  const re = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!re.test(v)) return { valid: false, error: 'Invalid GSTIN format (e.g. 29AABCU9603R1ZX)' };
  return { valid: true, formatted: v };
}

// PAN: 5 letters + 4 digits + 1 letter
export function validate_pan(value: string): ValidationResult {
  const v = value.trim().toUpperCase();
  if (!v) return { valid: false, error: 'PAN is required' };
  const re = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!re.test(v)) return { valid: false, error: 'Invalid PAN format (e.g. AABCU9603R)' };
  return { valid: true, formatted: v };
}

// CIN: 21-char MCA format
export function validate_cin(value: string): ValidationResult {
  const v = value.trim().toUpperCase();
  if (!v) return { valid: false, error: 'CIN is required' };
  const re = /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
  if (!re.test(v)) return { valid: false, error: 'Invalid CIN format (e.g. U74999MH2010PTC123456)' };
  return { valid: true, formatted: v };
}

// IEC: exactly 10 digits
export function validate_iec(value: string): ValidationResult {
  const v = value.trim().replace(/\s/g, '');
  if (!v) return { valid: false, error: 'IEC code is required' };
  if (!/^[0-9]{10}$/.test(v)) return { valid: false, error: 'IEC must be exactly 10 digits' };
  return { valid: true, formatted: v };
}

// Indian mobile: 10 digits starting with 6-9
export function validate_phone_in(value: string): ValidationResult {
  const digits = value.replace(/[\s\-().+]/g, '');
  // Strip country code
  const local = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
  if (!/^[6-9][0-9]{9}$/.test(local)) {
    return { valid: false, error: 'Enter a valid 10-digit Indian mobile number' };
  }
  return { valid: true, formatted: local };
}

// IFSC: 4 letters + 0 + 6 alphanumeric
export function validate_ifsc(value: string): ValidationResult {
  const v = value.trim().toUpperCase();
  if (!v) return { valid: false, error: 'IFSC code is required' };
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v)) {
    return { valid: false, error: 'Invalid IFSC format (e.g. HDFC0001234)' };
  }
  return { valid: true, formatted: v };
}

// Udyam / MSME registration number
export function validate_udyam(value: string): ValidationResult {
  const v = value.trim().toUpperCase();
  if (!v) return { valid: false, error: 'Udyam registration number is required' };
  if (!/^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/.test(v)) {
    return { valid: false, error: 'Invalid Udyam format (e.g. UDYAM-MH-00-0000001)' };
  }
  return { valid: true, formatted: v };
}

// Director Identification Number: exactly 8 digits
export function validate_din(value: string): ValidationResult {
  const v = value.trim();
  if (!v) return { valid: false, error: 'DIN is required' };
  if (!/^[0-9]{8}$/.test(v)) return { valid: false, error: 'DIN must be exactly 8 digits' };
  return { valid: true, formatted: v };
}

// Generic email
export function validate_email(value: string): ValidationResult {
  const v = value.trim().toLowerCase();
  if (!v) return { valid: false, error: 'Email is required' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { valid: false, error: 'Invalid email address' };
  return { valid: true, formatted: v };
}

// Generic URL
export function validate_url(value: string): ValidationResult {
  try {
    const u = new URL(value.trim());
    if (!['http:', 'https:'].includes(u.protocol)) {
      return { valid: false, error: 'URL must start with http:// or https://' };
    }
    return { valid: true, formatted: u.toString() };
  } catch {
    return { valid: false, error: 'Invalid URL' };
  }
}

// Registry of named validators (matches validation_function column in DB)
const VALIDATORS: Record<string, (v: string) => ValidationResult> = {
  validate_gstin,
  validate_pan,
  validate_cin,
  validate_iec,
  validate_phone_in,
  validate_ifsc,
  validate_udyam,
  validate_din,
  validate_email,
  validate_url,
};

export function runNamedValidator(name: string, value: string): ValidationResult {
  const fn = VALIDATORS[name];
  if (!fn) return { valid: true }; // Unknown validator — pass through
  return fn(value);
}

// ── Value Transforms ──────────────────────────────────────────────
// Applied before filling a portal field (matches value_transform column in DB)

export function applyTransform(transform: string | null, value: string): string {
  if (!transform || !value) return value;
  switch (transform) {
    case 'upper_case':    return value.toUpperCase();
    case 'lower_case':    return value.toLowerCase();
    case 'strip_spaces':  return value.replace(/\s/g, '');
    case 'title_case':    return value.replace(/\b\w/g, c => c.toUpperCase());
    case 'phone_in': {
      const digits = value.replace(/[\s\-().+]/g, '');
      return digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
    }
    case 'phone_intl': {
      const digits = value.replace(/[\s\-().+]/g, '');
      if (!digits.startsWith('+')) return '+' + digits;
      return digits;
    }
    case 'date_ddmmyyyy': {
      // Accepts ISO (YYYY-MM-DD) → DD/MM/YYYY
      const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) return `${m[3]}/${m[2]}/${m[1]}`;
      return value;
    }
    case 'date_yyyymmdd': {
      // Accepts DD/MM/YYYY → YYYY-MM-DD
      const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (m) return `${m[3]}-${m[2]}-${m[1]}`;
      return value;
    }
    case 'gst_format':    return value.trim().toUpperCase();
    case 'iec_format':    return value.trim().replace(/\s/g, '');
    default:              return value;
  }
}
