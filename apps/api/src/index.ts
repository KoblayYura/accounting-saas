// src/index.ts
// Точка входу: піднімає HTTP-сервер. Уся збірка застосунку — в app.ts.

import { app } from './app';
import { env } from './config/env';
import { registerObligationCrons } from './modules/obligations/obligations.cron';

app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
  // Планові задачі Module 03: позначення прострочених + нічна генерація зобов'язань.
  registerObligationCrons();
});
