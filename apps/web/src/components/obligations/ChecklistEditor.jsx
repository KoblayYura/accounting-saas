// src/components/obligations/ChecklistEditor.jsx
// Редактор чеклісту документів для форми створення зобов'язання (React Bootstrap).
// Динамічний список полів (додати/видалити рядок) через RHF useFieldArray.
// Поле форми — масив об'єктів { value } (useFieldArray вимагає об'єкти, не примітиви).

'use client';

import { useFieldArray } from 'react-hook-form';
import { Form, Button, InputGroup } from 'react-bootstrap';
import { useTranslations } from 'next-intl';

export function ChecklistEditor({ control, register }) {
  const t = useTranslations('obligations');
  const { fields, append, remove } = useFieldArray({ control, name: 'checklist_items' });

  return (
    <Form.Group className="mb-3">
      <Form.Label className="small fw-medium">{t('checklist')}</Form.Label>

      {fields.length === 0 ? (
        <p className="text-muted small mb-2">{t('checklistEditorEmpty')}</p>
      ) : (
        fields.map((field, index) => (
          <InputGroup key={field.id} size="sm" className="mb-2">
            <Form.Control
              placeholder={t('docNamePlaceholder')}
              aria-label={t('docNameAria', { index: index + 1 })}
              {...register(`checklist_items.${index}.value`)}
            />
            <Button
              variant="outline-secondary"
              aria-label={t('removeDoc')}
              onClick={() => remove(index)}
            >
              ✕
            </Button>
          </InputGroup>
        ))
      )}

      <Button variant="outline-secondary" size="sm" onClick={() => append({ value: '' })}>
        {t('addDoc')}
      </Button>
    </Form.Group>
  );
}
