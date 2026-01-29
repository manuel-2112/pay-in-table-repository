/**
 * Checkout View Component
 * 
 * Presentational component for checkout UI.
 * Follows Single Responsibility Principle: only renders checkout UI.
 * Dummy component - receives all data via props, no internal state/logic.
 * 
 * Note: Payment gateway integration will be handled by the payment method provider.
 */

import { CustomButton } from "@/components/design-system/ui/custom-button";
import { PaymentTotalCard } from "./payment-total-card";
import { CheckoutErrorState } from "./checkout-error-state";
import { isValidPaymentAmount } from "@/lib/utils/validation";
import { MIN_PAYMENT_AMOUNT } from "@/lib/constants/payment";

interface CheckoutViewProps {
  /**
   * Total amount to pay
   */
  total: number;
  /**
   * Tip amount
   */
  tip: number;
  /**
   * Klap order ID (null if not initialized)
   * Note: This will be used when integrating Klap payment gateway
   */
  orderId: string | null;
  /**
   * Whether checkout is loading
   */
  isLoading: boolean;
  /**
   * Error message (if any)
   */
  error: string | null;
  /**
   * Handler to initialize checkout
   */
  onCheckout: () => void;
  /**
   * Handler when payment succeeds
   */
  onPaymentSuccess: () => void;
  /**
   * Handler when payment fails
   */
  onPaymentError: (error: string) => void;
  /**
   * Handler to cancel checkout
   */
  onCancel?: () => void;
  /**
   * Handler to go back
   */
  onBack?: () => void;
}

/**
 * CheckoutView component
 * 
 * Displays checkout UI with payment total.
 * 
 * @example
 * ```tsx
 * <CheckoutView
 *   total={36850}
 *   tip={4125}
 *   orderId={orderId}
 *   isLoading={false}
 *   error={null}
 *   onCheckout={handleCheckout}
 *   onPaymentSuccess={handleSuccess}
 *   onPaymentError={handleError}
 * />
 * ```
 */
export function CheckoutView({
  total,
  tip,
  orderId,
  isLoading,
  error,
  onCheckout,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  onBack,
}: CheckoutViewProps) {
  const canPay = isValidPaymentAmount(total);

  return (
    <div className="space-y-6">
      {/* Payment Total */}
      <PaymentTotalCard total={total} tip={tip} isProcessing={isLoading} />

      {/* Error State */}
      {error && (
        <CheckoutErrorState
          message={error}
          onDismiss={onCancel}
          onRetry={onCheckout}
        />
      )}

      {/* Payment Section */}
      {orderId ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Método de pago</h2>
          {/* TODO: Implement KlapElementsWrapper when integrating payment gateway */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Klap payment integration coming soon
            </p>
          </div>
          {onCancel && (
            <CustomButton
              variant="outline"
              className="w-full"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar pago
            </CustomButton>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <CustomButton
            onClick={onCheckout}
            isLoading={isLoading}
            disabled={isLoading || !canPay}
            className="h-14 w-full text-base font-semibold"
            size="lg"
          >
            {isLoading ? "Inicializando..." : "Pagar ahora"}
          </CustomButton>
          {!canPay && (
            <p className="text-center text-xs text-muted-foreground">
              El monto mínimo de pago es{" "}
              {MIN_PAYMENT_AMOUNT.toLocaleString("es-CL")} CLP
            </p>
          )}
        </div>
      )}
    </div>
  );
}
