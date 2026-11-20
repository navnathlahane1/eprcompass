import SimpleLoginForm from '@/components/auth/SimpleLoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Task Manager – Sign In | EPR Compass' };

export default function TaskManagerLoginPage() {
  return (
    <SimpleLoginForm
      title="Task Manager"
      subtitle="Cross-portal task control centre. Monitor, escalate, and ensure on-time delivery of all operational tasks."
      dashboardPath="/taskmanager/dashboard"
      requiredRole={['task_manager', 'admin']}
      accent="gray"
      portal="taskmanager"
      showPortalSwitcher={false}
      showHelpLink={false}
      footerNote="Restricted operator access"
      features={[
        'Real-time early warning system',
        'Cross-portal task visibility',
        'Escalate & reassign any task',
        'SLA breach prediction & alerts',
      ]}
    />
  );
}

