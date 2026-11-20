/**
 * Centralised role-guard helpers for API routes.
 *
 * Usage:
 *   const deny = requireRole(actor, 'sales-executive');
 *   if (deny) return deny;
 *
 * Returning `null` means "allowed — proceed".
 * Returning a NextResponse means "denied — return this immediately".
 *
 * Why this exists:
 *   The previous pattern scattered `!TELECALLING_ROLES.includes(actor.role)` checks
 *   across 15+ route files, each with slight variations that caused real bugs
 *   (super-admins getting 403 because their DB role was not in the hardcoded list).
 *   This helper is the single source of truth for the permission logic.
 */

import { resolveActor, type Actor } from '@/lib/recyclerNetwork/networkAuth';
import { NextResponse } from 'next/server';

/**
 * Returns null when the actor is allowed, or a ready-to-return NextResponse
 * (401 / 403) when access should be denied.
 *
 * Access is granted when ANY of the following is true:
 *  • actor.isAdmin  — covers DB role 'admin', DB role 'manager', and any email
 *                     listed in SUPER_ADMIN_EMAILS / NEXT_PUBLIC_SUPER_ADMIN_EMAILS.
 *  • actor.role is in the caller-supplied `roles` list — e.g. 'sales-executive'.
 *
 * @param actor  Result of resolveActor(). null means unauthenticated → 401.
 * @param roles  Extra DB role values permitted beyond the admin tier.
 */
export function requireRole(actor: Actor | null, ...roles: string[]): NextResponse | null {
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const allowed = actor.isAdmin || roles.includes(actor.role);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

/**
 * Shorthand: only full admins (isAdmin === true) are allowed.
 * Equivalent to requireRole(actor) with no extra roles.
 */
export function requireAdmin(actor: Actor | null): NextResponse | null {
  return requireRole(actor);
}

/** Session + admin/manager/super-admin check for API routes that used service-role with no gate. */
export async function requireAdminSession(): Promise<{ actor: Actor | null; deny: NextResponse | null }> {
  const actor = await resolveActor();
  return { actor, deny: requireAdmin(actor) };
}
