/**
 * ItemSelectorRow - Row with quantity selector (+/−) per product
 *
 * One row per product (name + price). Shows selected quantity and buttons to increment/decrement.
 * WavyStrikethrough when user has selected the maximum available for this product.
 */

import { motion } from "motion/react";
import { cn, formatCurrency } from "@/lib/utils";
import { WavyStrikethrough } from "@/components/ui/wavy-strikethrough";

export interface SplitItem {
  id: string;
  text: string;
  price: number;
  selectedByMe: number;
  maxSelectable: number;
  /** When true, row is gray and not interactive (all reserved by others or paid) */
  disabled?: boolean;
}

interface ItemSelectorRowProps {
  item: SplitItem;
  onIncrement: (groupKey: string) => void;
  onDecrement: (groupKey: string) => void;
}

export function ItemSelectorRow({ item, onIncrement, onDecrement }: ItemSelectorRowProps) {
  const isDisabled = item.disabled === true;
  const atMax = item.selectedByMe === item.maxSelectable && item.maxSelectable > 0;
  const canIncrement = !isDisabled && item.selectedByMe < item.maxSelectable;
  const canDecrement = !isDisabled && item.selectedByMe > 0;

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canDecrement) onDecrement(item.id);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canIncrement) onIncrement(item.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-200",
        isDisabled
          ? "cursor-not-allowed bg-zinc-50/30 dark:bg-zinc-800/20"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
        item.selectedByMe > 0 && !isDisabled && "bg-zinc-50/50 dark:bg-zinc-800/30"
      )}
    >
      {/* Left: name + price (stacked) */}
      <div className="min-w-0 flex-1">
        <div className="relative inline-block">
          <motion.span
            className={cn(
              "text-xs font-medium transition-colors duration-200",
              isDisabled && "text-zinc-400 dark:text-zinc-500",
              !isDisabled &&
                (atMax
                  ? "text-zinc-400 dark:text-zinc-500"
                  : "text-zinc-800 dark:text-zinc-200")
            )}
          >
            {item.text}
          </motion.span>
          <WavyStrikethrough isVisible={atMax && !isDisabled} />
        </div>
        <p
          className={cn(
            "mt-0.5 text-[11px] tabular-nums transition-colors duration-200",
            (isDisabled || atMax)
              ? "text-zinc-400 dark:text-zinc-500"
              : "text-zinc-500 dark:text-zinc-400"
          )}
        >
          {formatCurrency(item.price * item.selectedByMe || item.price)}
        </p>
      </div>

      {/* Right: quantity controls − [count] + */}
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label="Reducir cantidad"
          disabled={!canDecrement}
          onClick={handleDecrement}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors",
            canDecrement
              ? "border-zinc-300 text-zinc-700 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] dark:border-zinc-600 dark:text-zinc-300"
              : "cursor-not-allowed border-zinc-200 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
          )}
        >
          −
        </button>
        <span
          className={cn(
            "min-w-[1rem] text-center text-xs font-medium tabular-nums",
            isDisabled ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-200"
          )}
        >
          {item.selectedByMe}
        </span>
        <button
          type="button"
          aria-label="Aumentar cantidad"
          disabled={!canIncrement}
          onClick={handleIncrement}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors",
            canIncrement
              ? "border-zinc-300 text-zinc-700 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] dark:border-zinc-600 dark:text-zinc-300"
              : "cursor-not-allowed border-zinc-200 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
          )}
        >
          +
        </button>
      </div>
    </motion.div>
  );
}
