type QuantityRow = { quantity: number | string; unit: string; state?: string | null; product_type?: string | null };

export function sumMassTonnes(rows: QuantityRow[]): number {
  let total = 0;
  for (const row of rows) {
    const quantity = Number(row.quantity);
    if (!Number.isFinite(quantity) || quantity < 0) throw new Error('Invalid recorded quantity');
    const unit = row.unit.trim().toUpperCase();
    if (!['MT', 'KG', 'TONNE', 'TONNES'].includes(unit)) throw new Error('Mass conversion requires a supported unit');
    total += unit === 'KG' ? quantity / 1000 : quantity;
  }
  if (!Number.isFinite(total)) throw new Error('Quantity total is out of range');
  return total;
}

export function assertNonOverlappingLiabilities(rows: QuantityRow[]) {
  const keys = new Set<string>();
  for (const row of rows) {
    const key = JSON.stringify([row.state || null, row.product_type || null]);
    if (keys.has(key)) throw new Error('Duplicate liability scope requires review');
    keys.add(key);
  }
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i], b = rows[j];
      const statesOverlap = !a.state || !b.state || a.state === b.state;
      const productsOverlap = !a.product_type || !b.product_type || a.product_type === b.product_type;
      if (statesOverlap && productsOverlap) throw new Error('Overlapping liability totals require review');
    }
  }
}
