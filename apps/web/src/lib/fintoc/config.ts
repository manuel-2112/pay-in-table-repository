/**
 * Fintoc configuration and constants.
 * Single Responsibility: public key, product, and env handling.
 * @see https://docs.fintoc.com/docs/web-integration
 */

import type { FintocProduct } from "./types";

/** Product value for Payment Initiation (checkout) */
export const FINTOC_PRODUCT_PAYMENTS: FintocProduct = "payments";

/**
 * Returns the Fintoc public key from environment.
 * Sandbox: pk_test_* | Production: pk_live_*
 * @throws if VITE_FINTOC_PUBLIC_KEY is missing and no fallback
 */
export function getFintocPublicKey(fallback?: string): string {
  const key = (import.meta as unknown as { env?: { VITE_FINTOC_PUBLIC_KEY?: string } }).env?.VITE_FINTOC_PUBLIC_KEY ?? fallback;
  if (!key) {
    throw new Error(
      "Fintoc public key is required. Set VITE_FINTOC_PUBLIC_KEY in .env or pass publicKey to the checkout config."
    );
  }
  return key;
}
