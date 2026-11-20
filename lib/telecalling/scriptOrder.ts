type TitledScript = { title?: string | null };

function normalizedTitle(script: TitledScript): string {
  return String(script.title || '').trim().toLowerCase();
}

export function placeTeluguAfterTamil<T extends TitledScript>(scripts: T[]): T[] {
  const ordered = [...scripts];
  const tamilIndex = ordered.findIndex(script => normalizedTitle(script) === 'tamil script epr');
  const teluguIndex = ordered.findIndex(script => normalizedTitle(script) === 'telugu script epr');

  if (tamilIndex < 0 || teluguIndex < 0 || teluguIndex === tamilIndex + 1) return ordered;

  const [telugu] = ordered.splice(teluguIndex, 1);
  const updatedTamilIndex = ordered.findIndex(script => normalizedTitle(script) === 'tamil script epr');
  ordered.splice(updatedTamilIndex + 1, 0, telugu);
  return ordered;
}
