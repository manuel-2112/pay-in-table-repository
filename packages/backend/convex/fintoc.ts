/**
 * Fintoc checkout session – backend only.
 * Creates a checkout session with Fintoc API using the real payment amount.
 */

import { action } from "./_generated/server";
import { v } from "convex/values";

const FINTOC_API_BASE = "https://api.fintoc.com/v1";

/**
 * Creates a Fintoc checkout session for the payment widget.
 * Uses the real amount (CLP, integer) provided by the client.
 */
export const createFintocCheckoutSession = action({
	args: {
		/** Amount to charge in CLP (integer, smallest unit; e.g. 15000 = $15.000) */
		amount: v.number(),
		/** Optional customer email for the session */
		customerEmail: v.optional(v.string()),
		/** URL to redirect on success (required by Fintoc v1 for checkout_sessions) */
		successUrl: v.optional(v.string()),
		/** URL to redirect on cancel (required by Fintoc v1 for checkout_sessions) */
		cancelUrl: v.optional(v.string()),
	},
	handler: async (_ctx, args) => {
		const secretKey = process.env.FINTOC_SECRET_KEY;
		if (!secretKey) {
			throw new Error("FINTOC_SECRET_KEY is not set in Convex environment");
		}

		const amount = Math.round(args.amount);
		if (amount < 1) {
			throw new Error("Amount must be at least 1 CLP");
		}
		const currency = "CLP";
		const customerEmail = args.customerEmail ?? "demo@payintable.com";
		// Fintoc requires HTTPS; use valid placeholders when frontend sends HTTP (e.g. localhost)
		const defaultSuccess = "https://example.com/demo/redirect/success";
		const defaultCancel = "https://example.com/demo/redirect/cancel";
		const successUrl =
			args.successUrl?.startsWith("https://") === true
				? args.successUrl
				: defaultSuccess;
		const cancelUrl =
			args.cancelUrl?.startsWith("https://") === true
				? args.cancelUrl
				: defaultCancel;

		const res = await fetch(`${FINTOC_API_BASE}/checkout_sessions`, {
			method: "POST",
			headers: {
				Authorization: secretKey,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				amount,
				currency,
				customer_email: customerEmail,
				success_url: successUrl,
				cancel_url: cancelUrl,
			}),
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Fintoc checkout session failed: ${res.status} ${text}`);
		}

		const data = (await res.json()) as {
			session_token?: string;
			redirect_url?: string;
		};
		const sessionToken = data?.session_token;
		if (!sessionToken) {
			throw new Error("Fintoc response missing session_token");
		}

		// session_token: for widget flow; redirect_url: for redirect flow
		return {
			session_token: sessionToken,
			redirect_url: data?.redirect_url ?? undefined,
		};
	},
});
