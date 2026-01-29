/**
 * FintocCheckout – opens Fintoc checkout widget when sessionToken is provided.
 * Single Responsibility: bridge React lifecycle with openFintocCheckout; cleanup on unmount.
 * @see https://docs.fintoc.com/docs/web-integration
 */

import { useEffect, useRef } from "react";
import { openFintocCheckout } from "@/lib/fintoc";
import type { FintocCheckoutCallbacks } from "@/lib/fintoc";

export interface FintocCheckoutProps {
  /**
   * Session token from backend (Create Checkout Session API).
   * When set, the widget opens; when cleared, widget is destroyed.
   */
  sessionToken: string | null;
  /**
   * Fintoc public key (pk_test_* or pk_live_*).
   * Defaults to VITE_FINTOC_PUBLIC_KEY.
   */
  publicKey?: string;
  /** Called when payment completes successfully */
  onSuccess?: () => void;
  /** Called when user closes the widget without completing */
  onExit?: () => void;
  /** Optional: widget events (opened, payment_created, closed, etc.) */
  onEvent?: (eventName: string, metadata: Record<string, unknown>) => void;
}

/**
 * Opens the Fintoc checkout widget when sessionToken is set.
 * Destroys the widget on unmount or when sessionToken becomes null.
 * Does not render any DOM; the widget is an iframe injected by the SDK.
 */
export function FintocCheckout({
  sessionToken,
  publicKey,
  onSuccess,
  onExit,
  onEvent,
}: FintocCheckoutProps) {
  const handleRef = useRef<Awaited<ReturnType<typeof openFintocCheckout>> | null>(null);
  const callbacksRef = useRef<FintocCheckoutCallbacks>({});
  callbacksRef.current = { onSuccess, onExit, onEvent };

  useEffect(() => {
    if (!sessionToken) {
      return;
    }

    const callbacks: FintocCheckoutCallbacks = {
      onSuccess: () => callbacksRef.current.onSuccess?.(),
      onExit: () => callbacksRef.current.onExit?.(),
      onEvent: (name, meta) => callbacksRef.current.onEvent?.(name, meta),
    };

    openFintocCheckout(
      { sessionToken, publicKey, product: "payments" },
      callbacks
    )
      .then((handle) => {
        handleRef.current = handle;
      })
      .catch((err) => {
        console.error("[FintocCheckout] Failed to open widget:", err);
        callbacksRef.current.onExit?.();
      });

    return () => {
      if (handleRef.current) {
        handleRef.current.destroy();
        handleRef.current = null;
      }
    };
  }, [sessionToken, publicKey]);

  return null;
}
