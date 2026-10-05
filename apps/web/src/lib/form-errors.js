// src/lib/form-errors.js
// Мапінг Laravel-style 422 errors ({ field: [msg, ...] }) на поля React Hook Form через setError.

/**
 * @param {import('react-hook-form').UseFormSetError<any>} setError
 * @param {Record<string, string[]>} errors
 */
export function applyServerErrors(setError, errors) {
  if (!errors || typeof errors !== 'object') return;
  for (const [field, messages] of Object.entries(errors)) {
    const message = Array.isArray(messages) ? messages[0] : String(messages);
    setError(field, { type: 'server', message });
  }
}
