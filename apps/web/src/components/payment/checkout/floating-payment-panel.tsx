/**
 * FloatingPaymentPanel - Fixed bottom payment summary panel
 *
 * Presentational component. Appears when visible (e.g. when selectedCount > 0
 * or always in tip view). Shows summary (subtotal, tax, total) and action button.
 * Dummy component - receives all data via props, no internal state/logic.
 *
 * Used in: tip selector view (total + Continuar), item selector / split (selected items total + Continuar).
 */

import { motion, AnimatePresence } from "motion/react";
import { formatCLP } from "@/lib/utils/currency";
import { CustomButton } from "@/components/design-system/ui/custom-button";
import { FLOATING_PANEL } from "@/lib/constants/copy";

export interface FloatingPaymentPanelProps {
  /** Number of selected items (0 = hide panel if controlled by parent, or use alwaysVisible) */
  selectedCount: number;
  /** Subtotal amount (CLP) */
  subtotal: number;
  /** Tax amount (CLP) */
  tax: number;
  /** Total amount including tax (CLP) */
  total: number;
  /** Callback when primary action is clicked */
  onPayNow?: () => void;
  /** Label for the action button */
  label?: string;
  /** If true, panel is always visible regardless of selectedCount (e.g. tip view) */
  alwaysVisible?: boolean;
  /** Optional subtitle above total (e.g. "1 elemento seleccionado") */
  subtitle?: string;
  /** Show loading state on the action button */
  isLoading?: boolean;
}

export function FloatingPaymentPanel({
  selectedCount,
  subtotal,
  tax,
  total,
  onPayNow,
  label = FLOATING_PANEL.DEFAULT_LABEL,
  alwaysVisible = false,
  subtitle,
  isLoading = false,
}: FloatingPaymentPanelProps) {
  const isVisible = alwaysVisible || selectedCount > 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-50"
        >
          <div className="border-t border-zinc-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
            <div className="mx-auto max-w-lg px-4 py-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  {subtitle != null ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {subtitle}
                    </p>
                  ) : selectedCount > 0 ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {selectedCount}{" "}
                      {selectedCount === 1
                        ? FLOATING_PANEL.ITEM_SELECTED_ONE
                        : FLOATING_PANEL.ITEM_SELECTED_MANY}
                    </p>
                  ) : null}
                  <p className="text-xl font-semibold text-zinc-900 dark:text-white tabular-nums">
                    {formatCLP(total)}
                  </p>
                </div>
                {onPayNow && (
                  <CustomButton
                    onClick={onPayNow}
                    className="shrink-0 px-8 py-3"
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    {isLoading ? FLOATING_PANEL.LOADING_LABEL : label}
                  </CustomButton>
                )}
              </div>
              <div className="flex justify-between text-xs text-zinc-400 dark:text-zinc-500">
                <span>
                  {FLOATING_PANEL.SUBTOTAL_LABEL}: {formatCLP(subtotal)}
                </span>
                <span>
                  {tax === 0
                    ? FLOATING_PANEL.IVA_INCLUDED
                    : `${FLOATING_PANEL.IVA_LABEL_PREFIX}${formatCLP(tax)}`}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
