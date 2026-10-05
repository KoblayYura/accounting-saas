// src/components/clients/ClientTypeSelect.jsx
// Select типу клієнта (React Bootstrap Form.Select). Опції — з lib/client-types.js
// (порядок enum), підписи — i18n. Рендеряться через .map(), не дублюються вручну.
//
// forwardRef — щоб працювати з React Hook Form register().

'use client';

import { forwardRef } from 'react';
import { Form } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { CLIENT_TYPES, CLIENT_TYPE_ORDER } from '@/lib/client-types';

export const ClientTypeSelect = forwardRef(function ClientTypeSelect(
  { label, placeholder, error, controlId = 'client_type', ...props },
  ref,
) {
  const t = useTranslations('clients');

  return (
    <Form.Group className="mb-3" controlId={controlId}>
      <Form.Label>{label ?? t('type')}</Form.Label>
      <Form.Select ref={ref} isInvalid={!!error} {...props}>
        <option value="">{placeholder ?? t('selectType')}</option>
        {CLIENT_TYPE_ORDER.map((value) => (
          <option key={value} value={value}>
            {t(CLIENT_TYPES[value].labelKey)}
          </option>
        ))}
      </Form.Select>
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
    </Form.Group>
  );
});
