// /clients/new — створення клієнта.
// Валідація — на бекенді: 422 → applyServerErrors → помилки під полями.
// При 403 CLIENT_LIMIT_REACHED показуємо модалку апгрейду замість generic-помилки (спека).
//
// TODO (спека module-02-clients/frontend.md, доповнення 2026-07-17): вкладки «Задачі» і «Запити».
// Потребують Module 17 (внутрішні задачі бухгалтера) і Module 11 (шаблони запитів) —
// у спеці позначені як чернетка з відкритими питаннями, тому тут не реалізовані.

'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useClients } from '@/hooks/use-clients';
import { applyServerErrors } from '@/lib/form-errors';
import { ClientForm } from '@/components/clients/ClientForm';
import { UpgradePlanModal } from '@/components/clients/UpgradePlanModal';

export default function NewClientPage() {
  const t = useTranslations('clients');
  const tc = useTranslations('common');
  const router = useRouter();
  const { createClient } = useClients();

  const formRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [isLimitModalOpen, setLimitModalOpen] = useState(false);

  const handleSubmit = (values) => {
    setServerError(null);
    setSubmitting(true);

    createClient(
      values,
      () => {
        setSubmitting(false);
        router.push('/clients');
      },
      (payload, status) => {
        setSubmitting(false);

        if (status === 422 && payload?.errors) {
          applyServerErrors(formRef.current?.setError, payload.errors);
          return;
        }
        if (payload?.error?.code === 'CLIENT_LIMIT_REACHED') {
          setLimitModalOpen(true);
          return;
        }
        setServerError(payload?.error?.message ?? tc('error'));
      },
    );
  };

  return (
    <div className="d-flex flex-column gap-4">
      <header className="d-flex flex-column gap-1">
        <Link href="/clients" className="small">
          {t('backToList')}
        </Link>
        <h1 className="h3 mb-0">{t('newClient')}</h1>
      </header>

      <ClientForm
        formRef={formRef}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        serverError={serverError}
        submitLabel={t('createClient')}
        onCancel={() => router.push('/clients')}
      />

      <UpgradePlanModal isOpen={isLimitModalOpen} onClose={() => setLimitModalOpen(false)} />
    </div>
  );
}
