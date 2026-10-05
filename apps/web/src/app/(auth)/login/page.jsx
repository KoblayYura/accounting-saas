'use client';

import { useTranslations } from 'next-intl';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  const t = useTranslations('auth');
  return (
    <AuthLayout title={t('loginTitle')} subtitle={t('loginSubtitle')}>
      <LoginForm />
    </AuthLayout>
  );
}
