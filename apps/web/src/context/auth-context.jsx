// src/context/auth-context.jsx
// Глобальний стан авторизації через React Context (замість Redux — новий стек).
// user + accessToken (у пам'яті, НЕ localStorage) + статус сесії. Усі операції — через dataSender.

'use client';

import { createContext, useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { dataSender, setAuthAccessors } from '@/lib/data-sender';

export const AuthContext = createContext(null);

const initialState = {
  user: null,
  accessToken: null,
  status: 'idle', // 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
  error: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'set_credentials':
      return {
        ...state,
        user: action.user,
        accessToken: action.accessToken,
        status: 'authenticated',
        error: null,
      };
    case 'clear':
      return { ...state, user: null, accessToken: null, status: 'unauthenticated', error: null };
    case 'set_status':
      return { ...state, status: action.status };
    default:
      return state;
  }
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  // accessToken у ref — щоб interceptor data-sender читав актуальне значення без ре-підписки.
  const tokenRef = useRef(null);
  tokenRef.current = state.accessToken;

  // Налаштовуємо data-sender: як брати токен, що робити після refresh / при фейлі сесії.
  useEffect(() => {
    setAuthAccessors({
      getToken: () => tokenRef.current,
      onRefreshed: (accessToken, user) => {
        if (user) dispatch({ type: 'set_credentials', accessToken, user });
      },
      onFailed: () => dispatch({ type: 'clear' }),
    });
  }, []);

  // --- Операції (усі на dataSender) ---

  const login = useCallback((data, onOk, onErr) => {
    return dataSender(
      '/auth/login',
      'post',
      data,
      (res) => {
        const { accessToken, user } = res.data.data;
        dispatch({ type: 'set_credentials', accessToken, user });
        onOk?.(res);
      },
      onErr,
    );
  }, []);

  const register = useCallback((data, onOk, onErr) => {
    // register не логінить (потрібне підтвердження email) — просто передаємо результат.
    return dataSender('/auth/register', 'post', data, onOk, onErr);
  }, []);

  const verifyEmail = useCallback((token, onOk, onErr) => {
    return dataSender(
      '/auth/verify-email',
      'post',
      { token },
      (res) => {
        const { accessToken, user } = res.data.data;
        dispatch({ type: 'set_credentials', accessToken, user });
        onOk?.(res);
      },
      onErr,
    );
  }, []);

  const resendVerification = useCallback((email, onOk, onErr) => {
    return dataSender('/auth/resend-verification', 'post', { email }, onOk, onErr);
  }, []);

  const logout = useCallback((onOk) => {
    return dataSender(
      '/auth/logout',
      'post',
      null,
      () => {
        dispatch({ type: 'clear' });
        onOk?.();
      },
      () => {
        dispatch({ type: 'clear' });
        onOk?.();
      },
    );
  }, []);

  const forgotPassword = useCallback((email, onOk, onErr) => {
    return dataSender('/auth/forgot-password', 'post', { email }, onOk, onErr);
  }, []);

  const resetPassword = useCallback((data, onOk, onErr) => {
    return dataSender('/auth/reset-password', 'post', data, onOk, onErr);
  }, []);

  const updateProfile = useCallback((data, onOk, onErr) => {
    return dataSender('/auth/me', 'patch', data, onOk, onErr);
  }, []);

  // Відновлення сесії при старті (refresh-cookie надсилається браузером).
  const startedRef = useRef(false);
  const refreshSession = useCallback(() => {
    dispatch({ type: 'set_status', status: 'loading' });
    return dataSender(
      '/auth/refresh',
      'post',
      null,
      (res) => {
        const { accessToken, user } = res.data.data;
        dispatch({ type: 'set_credentials', accessToken, user });
      },
      () => dispatch({ type: 'clear' }),
    );
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    refreshSession();
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      ...state,
      isAuthenticated: state.status === 'authenticated',
      login,
      register,
      verifyEmail,
      resendVerification,
      logout,
      forgotPassword,
      resetPassword,
      updateProfile,
      refreshSession,
    }),
    [
      state,
      login,
      register,
      verifyEmail,
      resendVerification,
      logout,
      forgotPassword,
      resetPassword,
      updateProfile,
      refreshSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
