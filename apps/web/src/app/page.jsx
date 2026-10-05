// Коренева сторінка: редіректить залежно від стану сесії.

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from 'react-bootstrap';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard');
    else if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  return (
    <div className="d-flex vh-100 align-items-center justify-content-center">
      <Spinner animation="border" variant="primary" />
    </div>
  );
}
