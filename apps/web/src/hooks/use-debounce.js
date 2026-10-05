// src/hooks/use-debounce.js
// Відкладає оновлення значення на delay мс. Використовується пошуком на /clients
// (спека: debounce 300мс), щоб не слати запит на кожне натискання клавіші.

'use client';

import { useEffect, useState } from 'react';

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
