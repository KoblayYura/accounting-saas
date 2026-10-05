// src/components/obligations/ObligationsList.jsx
// Переюзний список зобов'язань — і на дашборді, і в картці клієнта (приймає clientId/filters).
// Групування по секціях терміновості — КЛІЄНТСЬКЕ (спека: «клієнтська логіка, дублює
// urgency backend-фільтр»), рахується з due_date через lib/date.urgencyLevel.
//
// Термінові секції (прострочено / терміново / цей тиждень) — виділені картки (ObligationRow).
// Нетермінові («цей місяць», «пізніше») — таблиці з колонками (ObligationsTable).

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { useObligations } from '@/hooks/use-obligations';
import { urgencyLevel } from '@/lib/date';
import { Tooltip } from '@/components/ui/Tooltip';
import { ObligationRow } from './ObligationRow';
import { ObligationsTable } from './ObligationsTable';
import { ObligationDetailModal } from './ObligationDetailModal';

/** Термінові секції — виділені картки зверху, у порядку спадання терміновості. */
const URGENT_SECTIONS = ['overdue', 'urgent', 'soon'];
/** Нетермінові — таблицями: «Цей місяць» і «Пізніше». */
const CALM_SECTIONS = ['this_month', 'later'];

/** i18n-ключі заголовка та пояснення секції за рівнем терміновості. */
const SECTION_TITLE_KEY = {
  overdue: 'sectionOverdue',
  urgent: 'sectionUrgent',
  soon: 'sectionThisWeek',
  this_month: 'sectionThisMonth',
  later: 'sectionLater',
};
const SECTION_HINT_KEY = {
  overdue: 'sectionOverdueHint',
  urgent: 'sectionUrgentHint',
  soon: 'sectionThisWeekHint',
  this_month: 'sectionThisMonthHint',
  later: 'sectionLaterHint',
};

/** Заголовок секції: назва + лічильник + підказка (?) + пояснювальний підзаголовок. */
function SectionHeading({ titleKey, hintKey, count }) {
  const t = useTranslations('obligations');
  return (
    <div className="mb-2">
      <div className="d-flex align-items-center gap-2">
        <h3 className="h6 mb-0 fw-semibold">
          {t(titleKey)} ({count})
        </h3>
        <Tooltip content={t(hintKey)}>
          <span
            className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis"
            style={{ cursor: 'help' }}
            aria-label={t(hintKey)}
          >
            ?
          </span>
        </Tooltip>
      </div>
      <small className="text-muted">{t(hintKey)}</small>
    </div>
  );
}

export function ObligationsList({ clientId, filters }) {
  const t = useTranslations('obligations');
  const tc = useTranslations('common');
  const { getObligations } = useObligations();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);

  // Стабільний ключ фільтрів, щоб не перезапускати ефект на кожен рендер.
  const filtersKey = JSON.stringify(filters || {});

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getObligations(
      { ...(clientId ? { client_id: clientId } : {}), ...(filters || {}), limit: 100 },
      (data) => {
        setItems(data.items || []);
        setLoading(false);
      },
      (payload) => {
        setError(payload?.error?.message || tc('error'));
        setLoading(false);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, filtersKey]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const buckets = { overdue: [], urgent: [], soon: [], this_month: [], later: [] };
    for (const o of items) {
      buckets[urgencyLevel(o.due_date, o.status === 'overdue')].push(o);
    }
    return buckets;
  }, [items]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" className="me-2" />
        <span className="text-muted small">{tc('loading')}</span>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed rounded p-4 text-center text-muted">
        {t('emptyAllDone')}
      </div>
    );
  }

  /** Термінова секція — виділені картки. */
  const renderCardSection = (level) => {
    const rows = grouped[level];
    if (rows.length === 0) return null;
    return (
      <section key={level} className="mb-4">
        <SectionHeading
          titleKey={SECTION_TITLE_KEY[level]}
          hintKey={SECTION_HINT_KEY[level]}
          count={rows.length}
        />
        {rows.map((o) => (
          <ObligationRow
            key={o.id}
            obligation={o}
            onOpen={setOpenId}
            hideClient={Boolean(clientId)}
            onChanged={load}
          />
        ))}
      </section>
    );
  };

  /** Нетермінова секція — таблиця з колонками. */
  const renderTableSection = (level) => {
    const rows = grouped[level];
    if (rows.length === 0) return null;
    return (
      <section key={level} className="mb-4">
        <SectionHeading
          titleKey={SECTION_TITLE_KEY[level]}
          hintKey={SECTION_HINT_KEY[level]}
          count={rows.length}
        />
        <ObligationsTable
          obligations={rows}
          onOpen={setOpenId}
          hideClient={Boolean(clientId)}
          onChanged={load}
        />
      </section>
    );
  };

  return (
    <div>
      {URGENT_SECTIONS.map(renderCardSection)}
      {CALM_SECTIONS.map(renderTableSection)}

      <ObligationDetailModal
        obligationId={openId}
        show={openId !== null}
        onHide={() => setOpenId(null)}
        onChanged={load}
      />
    </div>
  );
}
