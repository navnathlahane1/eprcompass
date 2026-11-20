import { notFound } from 'next/navigation';
import AdminFormsSubmissionsClient from '../AdminFormsSubmissionsClient';
import { isValidFormKey } from '../formTypes';

type Props = {
  params: Promise<{ module: string }>;
};

export default async function AdminFormModulePage({ params }: Props) {
  const { module } = await params;

  if (!isValidFormKey(module) || module === 'all') {
    notFound();
  }

  return <AdminFormsSubmissionsClient initialType={module} />;
}
