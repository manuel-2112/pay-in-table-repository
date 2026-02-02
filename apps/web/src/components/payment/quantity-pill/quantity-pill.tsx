/**
 * QuantityPill - Pill-shaped quantity stepper (− value +) with optional label.
 * Center: primary (purple) with white value. Buttons: white bg, primary-color symbol.
 * Used for "Por partes iguales": total parts and parts to pay.
 */

import { cn } from "@/lib/utils";

export interface QuantityPillProps {
  value: number;
  min: number;
  max: number;
  onIncrement: () => void;
  onDecrement: () => void;
  /** Label shown to the right of the pill (e.g. "partes totales", "partes a pagar") */
  label?: string;
  /** Accessibility: describe what this control does */
  "aria-label"?: string;
  className?: string;
}

const buttonBase =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors bg-white text-[var(--brand-primary)] shadow-sm dark:bg-zinc-100 dark:text-[var(--brand-primary)]";

export function QuantityPill({
  value,
  min,
  max,
  onIncrement,
  onDecrement,
  label,
  "aria-label": ariaLabel,
  className,
}: QuantityPillProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        className
      )}
    >
      <div
        className="min-w-[6.5rem] shrink-0"
        aria-hidden
      >
        <div
          className="inline-flex items-center gap-0 rounded-full bg-[var(--brand-primary)] text-[var(--brand-primary-foreground)] p-1 shadow-sm"
          role="group"
          aria-label={ariaLabel}
        >
        <button
          type="button"
          aria-label="Reducir"
          disabled={!canDecrement}
          onClick={onDecrement}
          className={cn(
            buttonBase,
            canDecrement
              ? "hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-200 dark:active:bg-zinc-300"
              : "cursor-not-allowed opacity-50"
          )}
        >
          −
        </button>
        <span className="min-w-[1.5rem] text-center text-xs font-medium tabular-nums">
          {value}
        </span>
        <button
          type="button"
          aria-label="Aumentar"
          disabled={!canIncrement}
          onClick={onIncrement}
          className={cn(
            buttonBase,
            canIncrement
              ? "hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-200 dark:active:bg-zinc-300"
              : "cursor-not-allowed opacity-50"
          )}
        >
          +
        </button>
        </div>
      </div>
      {label != null && (
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {label}
        </span>
      )}
    </div>
  );
}
