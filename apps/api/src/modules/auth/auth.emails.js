// src/modules/auth/auth.emails.js
// Шаблони листів auth-модуля (окремо від бізнес-логіки — SOLID).

/** Лист зі скиданням пароля. */
const passwordResetEmail = (resetLink) => ({
  subject: 'Відновлення пароля — Accounting',
  text:
    `Ви (або хтось інший) запросили скидання пароля.\n\n` +
    `Перейдіть за посиланням, щоб встановити новий пароль:\n${resetLink}\n\n` +
    `Посилання дійсне 1 годину. Якщо ви не робили цього запиту — проігноруйте лист.`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #4f46e5;">Accounting</h2>
      <p>Ви (або хтось інший) запросили скидання пароля.</p>
      <p>Натисніть кнопку, щоб встановити новий пароль:</p>
      <p style="margin: 24px 0;">
        <a href="${resetLink}"
           style="background: #4f46e5; color: #fff; padding: 12px 20px; border-radius: 6px;
                  text-decoration: none; display: inline-block;">
          Скинути пароль
        </a>
      </p>
      <p style="font-size: 13px; color: #6b7280;">
        Посилання дійсне 1 годину. Якщо ви не робили цього запиту — просто проігноруйте лист.
      </p>
      <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">${resetLink}</p>
    </div>
  `,
});

/** Лист підтвердження email при реєстрації. */
const verifyEmailEmail = (verifyLink) => ({
  subject: 'Підтвердження email — Accounting',
  text:
    `Дякуємо за реєстрацію в Accounting!\n\n` +
    `Підтвердіть свою електронну адресу за посиланням:\n${verifyLink}\n\n` +
    `Посилання дійсне 24 години. Якщо ви не реєструвалися — проігноруйте лист.`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #4f46e5;">Accounting</h2>
      <p>Дякуємо за реєстрацію! Залишився один крок.</p>
      <p>Натисніть кнопку, щоб підтвердити свою електронну адресу:</p>
      <p style="margin: 24px 0;">
        <a href="${verifyLink}"
           style="background: #4f46e5; color: #fff; padding: 12px 20px; border-radius: 6px;
                  text-decoration: none; display: inline-block;">
          Підтвердити email
        </a>
      </p>
      <p style="font-size: 13px; color: #6b7280;">
        Посилання дійсне 24 години. Якщо ви не реєструвалися — просто проігноруйте лист.
      </p>
      <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">${verifyLink}</p>
    </div>
  `,
});

module.exports = { passwordResetEmail, verifyEmailEmail };
