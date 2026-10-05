// src/components/ui/DatePickerField.jsx
// Керований date-picker на react-datepicker з форматом dd.MM.yyyy і локалізацією (uk / en-GB).
// Нативний <input type="date"> показує дату у форматі локалі ОС (не контролюється) — тому саме
// react-datepicker, щоб гарантувати dd.MM.yyyy (напр. 26.09.2026).
//
// Працює зі string-значенням YYYY-MM-DD (формат, який чекає бек), а показує dd.MM.yyyy.
// Стиль поля — Bootstrap (form-control + is-invalid), щоб не випадати з решти форм.
//
// CSS react-datepicker — сторонній vendor-стиль (виняток із правила «лише *.module.css»).

'use client';

import DatePicker, { registerLocale } from 'react-datepicker';
import { uk } from 'date-fns/locale/uk';
import { enGB } from 'date-fns/locale/en-GB';
import { Form } from 'react-bootstrap';
import { useLocale } from 'next-intl';
import 'react-datepicker/dist/react-datepicker.css';

// Реєструємо локалі один раз (перший день тижня — понеділок для обох).
registerLocale('uk', uk);
registerLocale('en', enGB);

/** YYYY-MM-DD (value) → Date | null. */
const parseValue = (value) => {
  if (!value) return null;
  const [y, m, d] = String(value).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

/** Date → YYYY-MM-DD (без зсуву TZ — беремо локальні рік/місяць/день). */
const toValue = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * @param {string} value — YYYY-MM-DD
 * @param {(value: string) => void} onChange
 * @param {string} [label] — підпис поля
 * @param {string} [error] — серверна помилка (422) для is-invalid
 */
export function DatePickerField({ value, onChange, label, error, placeholder, id = 'due_date' }) {
  const locale = useLocale();

  return (
    <Form.Group className="mb-3" controlId={id}>
      {label && <Form.Label>{label}</Form.Label>}
      <DatePicker
        selected={parseValue(value)}
        onChange={(date) => onChange(toValue(date))}
        dateFormat="dd.MM.yyyy"
        locale={locale}
        placeholderText={placeholder || 'дд.мм.рррр'}
        className={`form-control${error ? ' is-invalid' : ''}`}
        wrapperClassName="w-100"
      />
      {/* d-block — бо invalid-feedback ховається, коли сусідній input не має .is-invalid у DOM-порядку */}
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </Form.Group>
  );
}
