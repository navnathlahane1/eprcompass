'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NewTenderRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/tendering/tenders');
  }, [router]);
  return null;
}
