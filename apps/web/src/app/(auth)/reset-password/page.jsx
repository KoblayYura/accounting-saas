'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  return (
    <AuthLayout title={t('resetTitle')} subtitle={t('resetSubtitle')}>
      {/* useSearchParams потребує Suspense-межі */}
      <Suspense fallback={<p className="text-center text-muted small">{tc('loading')}</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
