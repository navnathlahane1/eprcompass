import { describe, expect, it } from 'vitest';
import { placeTeluguAfterTamil } from './scriptOrder';

describe('Telecalling script ordering', () => {
  it('places the Telugu EPR script immediately after Tamil', () => {
    const scripts = [
      { id: 'telugu', title: 'Telugu script Epr' },
      { id: 'tamil', title: 'Tamil script Epr' },
      { id: 'pune', title: 'EPR Pune' },
    ];

    expect(placeTeluguAfterTamil(scripts).map(script => script.id)).toEqual(['tamil', 'telugu', 'pune']);
  });

  it('does not mutate the API response or reorder unrelated scripts', () => {
    const scripts = [
      { id: 'tamil', title: 'Tamil script Epr' },
      { id: 'telugu', title: 'Telugu script Epr' },
      { id: 'pune', title: 'EPR Pune' },
    ];

    const ordered = placeTeluguAfterTamil(scripts);
    expect(ordered).not.toBe(scripts);
    expect(ordered).toEqual(scripts);
  });
});
