'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TreasurerIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/treasurer/dashboard');
  }, [router]);

  return null;
}
