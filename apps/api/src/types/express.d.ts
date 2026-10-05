// src/types/express.d.ts
// Розширення типу Express Request: require-auth middleware кладе сюди id бухгалтера.

import 'express';

declare global {
  namespace Express {
    interface Request {
      /** Встановлюється require-auth middleware після верифікації JWT access-токена. */
      accountantId?: string;
    }
  }
}

export {};
