// src/components/obligations/ObligationsCalendar.jsx
// Календар дедлайнів на react-big-calendar (спека §6) з moment-локалізатором,
// синхронізованим з активною i18n-локаллю (перший день тижня — з локалі moment).
//
// КОНТРОЛЬОВАНИЙ режим: власний стан view+date з onView/onNavigate — інакше кнопки
// тулбара (Month/Week/Day/Agenda, Today/Back/Next) нічого не роблять.
// Створення події: selectable + onSelectSlot відкриває ObligationCreateModal з обраною датою.
//
// CSS пакета — сторонній vendor-стиль; наш override — у ObligationsCalendar.module.css.

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { useLocale, useTranslations } from 'next-intl';
import { useObligations } from '@/hooks/use-obligations';
import { applyMomentLocale, urgencyLevel } from '@/lib/date';
import { ObligationDetailModal } from './ObligationDetailModal';
import { ObligationCreateModal } from './ObligationCreateModal';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './ObligationsCalendar.module.css';

/** Колір події за рівнем терміновості (узгоджено з палітрою бейджів Bootstrap). */
const URGENCY_HEX = {
  overdue: '#dc3545',
  urgent: '#fd7e14',
  soon: '#ffc107',
  this_month: '#0d6efd',
  later: '#6c757d',
};

export function ObligationsCalendar({ clientId }) {
  const locale = useLocale();
  const tc = useTranslations('common');
  const tcal = useTranslations('calendar');
  const { getObligations } = useObligations();

  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [createDate, setCreateDate] = useState(null);

  // Локалайзер перестворюється при зміні мови: спершу застосовуємо локаль до moment
  // (щоб перший день тижня та назви місяців/днів відповідали мові), потім будуємо localizer.
  const localizer = useMemo(() => {
    applyMomentLocale(locale);
    return momentLocalizer(moment);
  }, [locale]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getObligations(
      { ...(clientId ? { client_id: clientId } : {}), limit: 100 },
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
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const events = useMemo(
    () =>
      items.map((o) => {
        const day = moment(o.due_date).toDate();
        return {
          title: `${o.name} — ${o.client_name}`,
          start: day,
          end: day,
          allDay: true,
          resource: o,
        };
      }),
    [items],
  );

  // Локалізовані підписи тулбара (Month/Week/Day/Agenda/Today/Back/Next тощо).
  const messages = useMemo(
    () => ({
      today: tcal('today'),
      previous: tcal('back'),
      next: tcal('next'),
      month: tcal('month'),
      week: tcal('week'),
      day: tcal('day'),
      agenda: tcal('agenda'),
      date: tcal('date'),
      time: tcal('time'),
      event: tcal('event'),
      noEventsInRange: tcal('noEvents'),
      showMore: (count) => tcal('showMore', { count }),
    }),
    [tcal],
  );

  const eventStyle = (event) => {
    const level = urgencyLevel(event.resource.due_date, event.resource.status === 'overdue');
    return { style: { backgroundColor: URGENCY_HEX[level], border: 'none' } };
  };

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

  return (
    <div>
      <div className="d-flex justify-content-end mb-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateDate(moment(date).format('YYYY-MM-DD'))}
        >
          {tcal('addObligation')}
        </Button>
      </div>

      <div className={`border rounded p-2 bg-white ${styles.calendarWrap}`}>
        <Calendar
          localizer={localizer}
          culture={locale}
          messages={messages}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          selectable
          popup
          eventPropGetter={eventStyle}
          onSelectEvent={(event) => setOpenId(event.resource.id)}
          onSelectSlot={(slot) => setCreateDate(moment(slot.start).format('YYYY-MM-DD'))}
          style={{ height: '100%' }}
        />
      </div>

      <ObligationDetailModal
        obligationId={openId}
        show={openId !== null}
        onHide={() => setOpenId(null)}
        onChanged={load}
      />

      <ObligationCreateModal
        show={createDate !== null}
        onHide={() => setCreateDate(null)}
        initialDate={createDate || ''}
        fixedClientId={clientId}
        onCreated={load}
      />
    </div>
  );
}
