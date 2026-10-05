// src/components/auth/VerifyEmail.jsx
// Сторінка /verify-email: бере token з query → verifyEmail → автологін → /dashboard.

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Spinner } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { AuthLayout } from './AuthLayout';

export function VerifyEmail() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { verifyEmail } = useAuth();
  const [state, setState] = useState('pending'); // 'pending' | 'success' | 'error'
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !token) {
      if (!token) setState('error');
      return;
    }
    startedRef.current = true;
    verifyEmail(
      token,
      () => {
        setState('success');
        setTimeout(() => router.replace('/dashboard'), 1200);
      },
      () => setState('error'),
    );
  }, [token, verifyEmail, router]);

  return (
    <AuthLayout title={t('verifyTitle')} subtitle={t('verifySubtitle')}>
      {state === 'error' ? (
        <div>
          <Alert variant="danger" className="small">{t('verifyFailed')}</Alert>
          <Link href="/login" className="d-block text-center small">{t('backToLogin')}</Link>
        </div>
      ) : state === 'success' ? (
        <Alert variant="success" className="small">{t('verifySuccess')}</Alert>
      ) : (
        <div className="d-flex flex-column align-items-center gap-2 py-3">
          <Spinner animation="border" variant="primary" />
          <span className="text-muted small">{t('verifyPending')}</span>
        </div>
      )}
    </AuthLayout>
  );
}
