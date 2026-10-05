// src/components/auth/RegisterForm.jsx
// Реєстрація головного бухгалтера (React Bootstrap + RHF). Валідація бізнес-правил — на бекенді (422).
// Клієнтом перевіряємо лише збіг паролів (миттєвий UX) + обов'язкову згоду. Телефон — маска (react-imask).
// Після успіху НЕ логінимо — показуємо «Перевірте пошту».

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { Form, Button, Alert } from 'react-bootstrap';
import { IMaskInput } from 'react-imask';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { applyServerErrors } from '@/lib/form-errors';
import { GoogleAuthButton } from './GoogleAuthButton';

export function RegisterForm() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const { register: registerUser } = useAuth();

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      login: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      consent: false,
    },
  });

  const onSubmit = (values) => {
    setFormError(null);

    // Клієнтські перевірки для миттєвого UX (не дублюють бізнес-правила).
    if (values.password !== values.confirmPassword) {
      setError('confirmPassword', { type: 'client', message: t('passwordsMismatch') });
      return;
    }
    if (!values.consent) {
      setError('consent', { type: 'client', message: t('consentRequired') });
      return;
    }

    setSubmitting(true);
    registerUser(
      { login: values.login, email: values.email, phone: values.phone, password: values.password },
      () => {
        setSubmitting(false);
        setSubmitted(true);
      },
      (payload, status) => {
        setSubmitting(false);
        if (status === 422 && payload?.errors) applyServerErrors(setError, payload.errors);
        else setFormError(payload?.error?.message ?? tc('error'));
      },
    );
  };

  if (submitted) {
    return (
      <div>
        <Alert variant="success" className="small">
          <strong className="d-block">{t('checkEmailTitle')}</strong>
          {t('checkEmailBody')}
        </Alert>
        <Link href="/login" className="d-block text-center small">
          {t('backToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} noValidate>
      {formError && (
        <Alert variant="danger" className="py-2 small">
          {formError}
        </Alert>
      )}

      <Form.Group className="mb-3" controlId="login">
        <Form.Label>{t('login')}</Form.Label>
        <Form.Control autoComplete="username" isInvalid={!!errors.login} {...register('login')} />
        <Form.Control.Feedback type="invalid">{errors.login?.message}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3" controlId="email">
        <Form.Label>{t('email')}</Form.Label>
        <Form.Control type="email" autoComplete="email" isInvalid={!!errors.email} {...register('email')} />
        <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3" controlId="phone">
        <Form.Label>{t('phone')}</Form.Label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <IMaskInput
              mask="+000000000000000"
              value={field.value}
              unmask={false}
              inputMode="tel"
              placeholder="+380 67 123 45 67"
              onAccept={field.onChange}
              onBlur={field.onBlur}
              className={`form-control${errors.phone ? ' is-invalid' : ''}`}
            />
          )}
        />
        <Form.Control.Feedback type="invalid">{errors.phone?.message}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3" controlId="password">
        <Form.Label>{t('password')}</Form.Label>
        <Form.Control
          type="password"
          autoComplete="new-password"
          isInvalid={!!errors.password}
          {...register('password')}
        />
        <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3" controlId="confirmPassword">
        <Form.Label>{t('confirmPassword')}</Form.Label>
        <Form.Control
          type="password"
          autoComplete="new-password"
          isInvalid={!!errors.confirmPassword}
          {...register('confirmPassword')}
        />
        <Form.Control.Feedback type="invalid">{errors.confirmPassword?.message}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3" controlId="consent">
        <Form.Check
          type="checkbox"
          label={t('consent')}
          isInvalid={!!errors.consent}
          feedback={errors.consent?.message}
          feedbackType="invalid"
          {...register('consent')}
        />
      </Form.Group>

      <Button type="submit" variant="primary" className="w-100" disabled={submitting}>
        {submitting ? tc('wait') : t('signUp')}
      </Button>

      <div className="text-center text-muted small my-2">{tc('or')}</div>

      <GoogleAuthButton label={t('googleSignUp')} />

      <p className="text-center text-muted small mt-3 mb-0">
        {t('haveAccount')} <Link href="/login">{t('signIn')}</Link>
      </p>
    </Form>
  );
}
