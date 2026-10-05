// src/components/clients/UpgradePlanModal.jsx
// Показується замість generic-помилки, коли POST /clients повертає 403 CLIENT_LIMIT_REACHED.
// Тарифи вантажаться з GET /billing/plans (не хардкодяться — вимога спеки Module 06);
// назви планів перекладаються на фронті (бек віддає лише plan/clientLimit/pricePerMonthUah).

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Modal, Button, ListGroup } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { useBilling } from '@/hooks/use-billing';

export function UpgradePlanModal({ isOpen, onClose }) {
  const t = useTranslations('billing');
  const tc = useTranslations('common');
  const { getPlans } = useBilling();
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    getPlans(setPlans, () => setPlans([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Безкоштовний план у списку апгрейду не показуємо.
  const upgradePlans = plans.filter((p) => p.plan !== 'free');

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h5">{t('upgradeTitle')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="text-muted small">{t('upgradeBody')}</p>
        <ListGroup>
          {upgradePlans.map(({ plan, clientLimit, pricePerMonthUah }) => (
            <ListGroup.Item key={plan} className="d-flex justify-content-between align-items-center">
              <span className="fw-medium">{t(`plan_${plan}`)}</span>
              <span className="text-muted small">
                {clientLimit === -1 ? t('planUnlimited') : t('planUpTo', { limit: clientLimit })}
                {' · '}
                {t('planPrice', { price: pricePerMonthUah })}
              </span>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          {tc('close')}
        </Button>
        <Link href="/settings/billing" className="btn btn-primary">
          {t('upgradeAction')}
        </Link>
      </Modal.Footer>
    </Modal>
  );
}
