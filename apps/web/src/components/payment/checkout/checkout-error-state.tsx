/**
 * Checkout Error State Component
 * 
 * Presentational component for checkout errors.
 * Follows Single Responsibility Principle: only renders error UI.
 * Dummy component - receives all data via props, no internal state/logic.
 */

import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CheckoutErrorStateProps {
  /**
   * Error message
   */
  message: string;
  /**
   * Handler to dismiss error
   */
  onDismiss?: () => void;
  /**
   * Handler to retry
   */
  onRetry?: () => void;
}

/**
 * CheckoutErrorState component
 * 
 * Displays checkout error with retry option.
 * 
 * @example
 * ```tsx
 * <CheckoutErrorState
 *   message="Error al procesar el pago"
 *   onDismiss={() => setError(null)}
 *   onRetry={() => handleCheckout()}
 * />
 * ```
 */
export function CheckoutErrorState({
  message,
  onDismiss,
  onRetry,
}: CheckoutErrorStateProps) {
  return (
    <Card className="border-destructive bg-destructive/10 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-destructive">
            Error en el pago
          </p>
          <p className="text-sm text-muted-foreground">{message}</p>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Intentar nuevamente
            </Button>
          )}
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
