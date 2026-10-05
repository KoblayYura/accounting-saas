'use client';

import { useTranslations } from 'next-intl';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  const t = useTranslations('auth');
  return (
    <AuthLayout title={t('registerTitle')} subtitle={t('registerSubtitle')}>
      <RegisterForm />
    </AuthLayout>
  );
}
