/**
 * ItemSelectorRow - Interactive row with animated checkbox for item selection
 *
 * Presentational component for Split page item selection.
 * Features animated circular checkbox and wavy strikethrough effect.
 * 
 * Dummy component - receives all data via props, no internal state/logic.
 */

import { motion, AnimatePresence } from "motion/react";
import { cn, formatCurrency } from "@/lib/utils";
import { WavyStrikethrough } from "@/components/ui/wavy-strikethrough";

export interface SplitItem {
  id: string;
  text: string;
  completed: boolean;
  price?: number;
  quantity?: number;
  /** When true, row is gray and not clickable (e.g. reserved by another user or paid) */
  disabled?: boolean;
}

interface ItemSelectorRowProps {
  item: SplitItem;
  onToggle: (id: string) => void;
}

export function ItemSelectorRow({ item, onToggle }: ItemSelectorRowProps) {
  const isDisabled = item.disabled === true;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group flex items-center gap-4 rounded-xl px-4 py-4 transition-colors duration-200",
        isDisabled
          ? "cursor-not-allowed bg-zinc-50/30 dark:bg-zinc-800/20"
          : "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
        item.completed && !isDisabled && "bg-zinc-50/50 dark:bg-zinc-800/30"
      )}
      onClick={() => !isDisabled && onToggle(item.id)}
    >
      {/* Custom Animated Checkbox */}
      <div className="relative flex-shrink-0">
        <motion.div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors duration-200",
            isDisabled && "border-zinc-300 dark:border-zinc-600 opacity-60",
            !isDisabled &&
              (item.completed
                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]"
                : "border-zinc-300 group-hover:border-[var(--brand-primary)] dark:border-zinc-600")
          )}
          whileTap={isDisabled ? undefined : { scale: 0.9 }}
        >
          <AnimatePresence>
            {item.completed && (
              <motion.svg
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-3.5 w-3.5 text-[var(--brand-foreground)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Item Content */}
      <div className="min-w-0 flex-1">
        <div className="relative inline-block">
          <motion.span
            className={cn(
              "text-base font-medium transition-colors duration-200",
              isDisabled && "text-zinc-400 dark:text-zinc-500",
              !isDisabled &&
                (item.completed
                  ? "text-zinc-400 dark:text-zinc-500"
                  : "text-zinc-800 dark:text-zinc-200")
            )}
          >
            {item.text}
          </motion.span>
          <WavyStrikethrough isVisible={item.completed && !isDisabled} />
        </div>
        {item.quantity && item.quantity > 1 && (
          <span className="ml-2 text-sm text-zinc-400 dark:text-zinc-500">
            x{item.quantity}
          </span>
        )}
      </div>

      {/* Price */}
      {item.price !== undefined && (
        <motion.span
          className={cn(
            "text-base font-medium tabular-nums transition-colors duration-200",
            (isDisabled || item.completed)
              ? "text-zinc-400 dark:text-zinc-500"
              : "text-zinc-700 dark:text-zinc-300"
          )}
          animate={{
            scale: item.completed && !isDisabled ? 0.95 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {formatCurrency(item.price * (item.quantity || 1))}
        </motion.span>
      )}
    </motion.div>
  );
}
