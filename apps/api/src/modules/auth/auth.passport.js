// src/modules/auth/auth.passport.js
// Налаштування passport Google OAuth2 стратегії.
// Реєструється лише якщо Google-ключі присутні в env (isGoogleOAuthEnabled).
// Сесії не використовуємо (stateless JWT), тому passport.session() не потрібен.

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { env, isGoogleOAuthEnabled } = require('../../config/env');
const authService = require('./auth.service');

const configureGooglePassport = () => {
  if (!isGoogleOAuthEnabled) {
    console.warn(
      '[passport] Google OAuth не налаштований (немає GOOGLE_* env) — /auth/google вимкнено',
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('Google-профіль не містить email'));
          }
          const authResult = await authService.handleGoogleProfile({
            email,
            googleId: profile.id,
            name: profile.displayName || email,
          });
          // Результат потрапить у req.user, звідки controller візьме refreshToken.
          return done(null, authResult);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );
};

module.exports = { configureGooglePassport };
