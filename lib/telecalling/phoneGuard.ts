// Business rule: a lead must have a usable phone number before it can be
// allocated to a telecaller. Phone-less leads cannot be called, so they are
// never assigned to an agent. This is enforced at every assignment path — see
// callers of leadHasPhone() across the telecalling + telecaller-admin routes.

/** True when a phone/mobile value is missing or whitespace-only. */
export function isBlankPhone(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === '';
}

/**
 * True when a lead has at least one usable phone number.
 *
 * Works for the `leads` table, where phone may live in `phone` or `mobile`
 * depending on which schema shape a given row was inserted with.
 */
export function leadHasPhone(
  lead: { phone?: unknown; mobile?: unknown } | null | undefined
): boolean {
  if (!lead) return false;
  return !isBlankPhone(lead.phone) || !isBlankPhone(lead.mobile);
}
