import { beforeEach, describe, expect, it, vi } from 'vitest';
import { canAccessRoute } from '@/lib/academy/access';

const { actor, redirect } = vi.hoisted(() => ({ actor: vi.fn(), redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));
vi.mock('@/lib/academy/auth', () => ({ resolveAcademyUser: actor }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/app/academy/dashboard/DirectorDashboard', () => ({ default: () => null }));
vi.mock('@/app/academy/dashboard/ManagerDashboard', () => ({ default: () => null }));
vi.mock('@/app/academy/dashboard/ProgramManagerDashboard', () => ({ default: () => null }));
vi.mock('@/app/academy/dashboard/TrainerDashboard', () => ({ default: () => null }));
vi.mock('@/app/academy/dashboard/GuestTrainerDashboard', () => ({ default: () => null }));
vi.mock('@/app/academy/dashboard/PartnerTrainerDashboard', () => ({ default: () => null }));

import AcademyDashboardPage from '@/app/academy/dashboard/page';

describe('Academy learner sign-in routing', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('sends an authenticated learner to the existing permitted learning page', async () => {
    actor.mockResolvedValue({ id: 'learner-test', role: 'learner' });
    await expect(AcademyDashboardPage()).rejects.toThrow('REDIRECT:/academy/learners/my');
    expect(canAccessRoute('learner', '/academy/learners/my')).toBe(true);
    expect(redirect).not.toHaveBeenCalledWith('/academy/login');
  });
  it('keeps unauthenticated visitors at the login gate', async () => {
    actor.mockResolvedValue(null);
    await expect(AcademyDashboardPage()).rejects.toThrow('REDIRECT:/academy/login');
  });
});
