import { resolveAcademyUser } from '@/lib/academy/auth';
import { redirect } from 'next/navigation';
import DirectorDashboard       from './DirectorDashboard';
import ManagerDashboard        from './ManagerDashboard';
import ProgramManagerDashboard from './ProgramManagerDashboard';
import TrainerDashboard        from './TrainerDashboard';
import GuestTrainerDashboard   from './GuestTrainerDashboard';
import PartnerTrainerDashboard from './PartnerTrainerDashboard';

export default async function AcademyDashboardPage() {
  const actor = await resolveAcademyUser();
  if (!actor) redirect('/academy/login');

  switch (actor.role) {
    case 'academy_director':
    case 'admin':
      return <DirectorDashboard />;

    case 'academy_manager':
      return <ManagerDashboard />;

    case 'training_program_manager':
      return <ProgramManagerDashboard userName={actor.fullName ?? undefined} />;

    case 'trainer':
      return <TrainerDashboard userName={actor.fullName ?? undefined} />;

    case 'guest_trainer':
      return <GuestTrainerDashboard userName={actor.fullName ?? undefined} />;

    case 'partner_trainer':
      return <PartnerTrainerDashboard userName={actor.fullName ?? undefined} />;

    case 'learner':
      redirect('/academy/learners/my');

    default:
      redirect('/academy/login');
  }
}
