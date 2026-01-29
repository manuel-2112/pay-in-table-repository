/**
 * Fintoc integration – checkout widget (Payment Initiation).
 * Modular API: types, config, open-checkout.
 * @see https://docs.fintoc.com/docs/web-integration
 * @see https://docs.fintoc.com/docs/webview
 */

export { getFintocPublicKey, FINTOC_PRODUCT_PAYMENTS } from "./config";
export { openFintocCheckout } from "./open-checkout";
export type {
  FintocCheckoutCallbacks,
  FintocCheckoutConfig,
  FintocProduct,
  FintocWidgetHandle,
} from "./types";
