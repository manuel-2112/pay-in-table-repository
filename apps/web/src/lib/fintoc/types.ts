/**
 * Fintoc integration types.
 * Single Responsibility: type definitions for checkout widget and config.
 * @see https://docs.fintoc.com/docs/web-integration
 * @see https://docs.fintoc.com/docs/webview
 */

/** Product types supported by Fintoc widget */
export type FintocProduct = "payments" | "movements" | "subscriptions" | "invoices";

/** Callbacks for Payment Initiation (checkout) widget */
export interface FintocCheckoutCallbacks {
  /** Called when the payment flow completes successfully */
  onSuccess?: () => void;
  /** Called when the user closes the widget without completing */
  onExit?: () => void;
  /** Optional: called for widget events (opened, link_created, payment_created, etc.) */
  onEvent?: (eventName: string, metadata: Record<string, unknown>) => void;
}

/** Config required to open the checkout widget (web: sessionToken from backend) */
export interface FintocCheckoutConfig {
  /** Session token from Create Checkout Session API (backend) */
  sessionToken: string;
  /** Public key (pk_test_* or pk_live_*). Defaults to env VITE_FINTOC_PUBLIC_KEY */
  publicKey?: string;
  /** Product. Use "payments" for checkout */
  product?: FintocProduct;
}

/** Return type of openFintocCheckout: cleanup and control */
export interface FintocWidgetHandle {
  /** Hide the widget (can reopen) */
  hide: () => void;
  /** Destroy the widget instance */
  destroy: () => void;
}
