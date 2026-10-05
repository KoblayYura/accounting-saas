// src/components/auth/AuthCallback.jsx
// Технічна сторінка після Google OAuth: бекенд уже поставив refresh-cookie →
// refreshSession → отримуємо access-токен → редірект /dashboard.

'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { AuthLayout } from './AuthLayout';

export function AuthCallback() {
  const router = useRouter();
  const t = useTranslations('auth');
  const { refreshSession } = useAuth();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    refreshSession().then(() => {
      // refreshSession виставить статус; редіректимо в обох випадках через невелику паузу
      setTimeout(() => router.replace('/dashboard'), 300);
    });
  }, [refreshSession, router]);

  return (
    <AuthLayout title={t('verifyTitle')} subtitle={t('verifySubtitle')}>
      <div className="d-flex justify-content-center py-3">
        <Spinner animation="border" variant="primary" />
      </div>
    </AuthLayout>
  );
}
