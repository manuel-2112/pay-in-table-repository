/**
 * Payment Total Card Component
 * 
 * Presentational component for displaying final payment total.
 * Follows Single Responsibility Principle: only renders total UI.
 * Dummy component - receives all data via props, no internal state/logic.
 */

import { Card } from "@/components/ui/card";
import { formatCLP } from "@/lib/utils/currency";

interface PaymentTotalCardProps {
  /**
   * Total amount to pay
   */
  total: number;
  /**
   * Tip amount
   */
  tip: number;
  /**
   * Whether payment is processing
   */
  isProcessing?: boolean;
}

/**
 * PaymentTotalCard component
 * 
 * Displays final payment total in a prominent card.
 * 
 * @example
 * ```tsx
 * <PaymentTotalCard
 *   total={36850}
 *   tip={4125}
 *   isProcessing={false}
 * />
 * ```
 */
export function PaymentTotalCard({
  total,
  tip,
  isProcessing = false,
}: PaymentTotalCardProps) {
  return (
    <Card className="border-2 border-primary bg-primary/5 p-6">
      <div className="space-y-2 text-center">
        <p className="text-sm text-muted-foreground">Total a pagar</p>
        <p
          className={`text-3xl font-bold ${isProcessing ? "opacity-50" : ""}`}
        >
          {formatCLP(total)}
        </p>
        {tip > 0 && (
          <p className="text-xs text-muted-foreground">
            Incluye propina de {formatCLP(tip)}
          </p>
        )}
      </div>
    </Card>
  );
}
