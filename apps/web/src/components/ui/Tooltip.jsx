// src/components/ui/Tooltip.jsx
// Переюзний тултип на @radix-ui/react-tooltip (accessible: ARIA, клавіатура, фокус, портал).
// Обгортає будь-який trigger; показує підказку `content` при наведенні/фокусі.
//
// Provider вбудований у компонент (delayDuration 200мс) — не потребує обгортки в layout.
// Стилі — Bootstrap-утиліти (темна плашка), узгоджено з рештою UI після міграції стеку.
//
// Коли використовувати: складні тригери, потреба в порталі/точному позиціюванні.
// Для простих випадків у таблицях також є React Bootstrap OverlayTrigger.

'use client';

import * as RadixTooltip from '@radix-ui/react-tooltip';
import styles from './Tooltip.module.css';

/**
 * @param {string} content — текст підказки
 * @param {React.ReactNode} children — тригер (елемент, на який наводять)
 * @param {'top'|'right'|'bottom'|'left'} [side] — сторона появи
 */
export function Tooltip({ content, children, side = 'top' }) {
  return (
    <RadixTooltip.Provider delayDuration={200}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            align="start"
            sideOffset={6}
            className={`bg-dark text-white rounded px-3 py-2 shadow small ${styles.content}`}
          >
            {content}
            <RadixTooltip.Arrow className={styles.arrow} />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
