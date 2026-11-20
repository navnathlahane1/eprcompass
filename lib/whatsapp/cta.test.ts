import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { whatsappUrl } from './cta';

describe('Public contact links', () => {
  it('routes to the contact page while verified contact details are pending', () => {
    expect(whatsappUrl('EPR help')).toBe('/contact');
  });
  it('routes empty messages to the contact page too', () => {
    expect(whatsappUrl('  ')).toBe('/contact');
  });
});

function contrast(a: string, b: string) {
  const luminance = (hex: string) => {
    const rgb = hex.match(/[a-f0-9]{2}/gi)!.map(value => {
      const channel = parseInt(value, 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe('WhatsApp button contrast regression', () => {
  it.each(['ffffff', 'f3f4f6'])('keeps dark green text legible on %s', background => {
    expect(contrast('066e4e', background)).toBeGreaterThanOrEqual(4.5);
  });
  it.each(['25d366', '1ebe5d', '20bd5a'])('keeps text legible on WhatsApp green %s', background => {
    expect(contrast('052e16', background)).toBeGreaterThanOrEqual(4.5);
  });
  it.each(['app/global-coverage/page.jsx', 'app/epr/[country]/page.jsx'])('does not use pale text on white CTAs in %s', path => {
    const source = readFileSync(resolve(process.cwd(), path), 'utf8');
    expect(source).not.toMatch(/className="[^"]*bg-white[^"\n]*text-eco-green-1/);
    expect(source).toContain('text-eco-green-5');
  });
});
