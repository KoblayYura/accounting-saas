// src/utils/validation-error.js
// Валідаційна помилка у стилі Laravel. Кидається з *.validation.js до бізнес-логіки,
// обробляється централізовано в error-handler → HTTP 422 { message, errors: { field: [...] } }.

class ValidationError extends Error {
  /**
   * @param {Record<string, string[]>} errors — { поле: [повідомлення, ...] }
   * @param {string} [message]
   */
  constructor(errors, message = 'The given data was invalid.') {
    super(message);
    this.name = 'ValidationError';
    this.status = 422;
    this.errors = errors;
  }
}

/**
 * Зручний збирач помилок по полях. Використання:
 *   const v = new Validator();
 *   if (!email) v.add('email', "Поле email обов'язкове.");
 *   v.throwIfAny();
 */
class Validator {
  constructor() {
    /** @type {Record<string, string[]>} */
    this.errors = {};
  }

  add(field, message) {
    if (!this.errors[field]) this.errors[field] = [];
    this.errors[field].push(message);
    return this;
  }

  hasErrors() {
    return Object.keys(this.errors).length > 0;
  }

  throwIfAny() {
    if (this.hasErrors()) throw new ValidationError(this.errors);
  }
}

module.exports = { ValidationError, Validator };
