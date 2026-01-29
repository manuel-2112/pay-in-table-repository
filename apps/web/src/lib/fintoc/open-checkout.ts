/**
 * Opens the Fintoc checkout widget (Payment Initiation).
 * Single Responsibility: load SDK, create widget, open it, return handle.
 * @see https://docs.fintoc.com/docs/web-integration
 * @see https://docs.fintoc.com/reference/create-checkout-session
 */

import { getFintoc } from "@fintoc/fintoc-js";
import { FINTOC_PRODUCT_PAYMENTS, getFintocPublicKey } from "./config";
import type { FintocCheckoutCallbacks, FintocCheckoutConfig, FintocWidgetHandle } from "./types";

/**
 * Opens the Fintoc checkout widget with the given session token and callbacks.
 * The backend must create a Checkout Session (POST /v1/checkout_sessions) and return the session_token.
 *
 * @param config - sessionToken (required), optional publicKey and product
 * @param callbacks - onSuccess, onExit, optional onEvent
 * @returns Handle with hide() and destroy() for cleanup
 * @throws If public key is missing (env VITE_FINTOC_PUBLIC_KEY or config.publicKey)
 */
export async function openFintocCheckout(
  config: FintocCheckoutConfig,
  callbacks: FintocCheckoutCallbacks = {}
): Promise<FintocWidgetHandle> {
  const publicKey = config.publicKey ?? getFintocPublicKey();
  const product = config.product ?? FINTOC_PRODUCT_PAYMENTS;

  const Fintoc = await getFintoc();
  if (!Fintoc) {
    throw new Error("Fintoc SDK failed to load.");
  }

  const widget = Fintoc.create({
    product,
    publicKey,
    sessionToken: config.sessionToken,
    onSuccess: callbacks.onSuccess,
    onExit: callbacks.onExit,
    onEvent: callbacks.onEvent,
  });

  widget.open();

  return {
    hide: () => widget.close(),
    destroy: () => widget.destroy(),
  };
}
