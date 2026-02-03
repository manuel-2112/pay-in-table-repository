/**
 * Pay redirect – success return URL.
 * Fintoc redirects here after successful payment. Read token from search,
 * restore payload from sessionStorage, call confirmPayment or payEqualPartSlotsByCount, then show success.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@pay-in-table-repository/backend/convex/_generated/api";
import { MobileContainer, PageHeader } from "@/components/design-system/layout";
import { CustomButton } from "@/components/design-system/ui/custom-button";
import { useSessionCheckout } from "@/lib/xstate";
import type { Id } from "@pay-in-table-repository/backend/convex/_generated/dataModel";
import type { PayRedirectPayload } from "./pay";

const PAY_REDIRECT_STORAGE_KEY = "payRedirect";

function getRedirectPayload(): PayRedirectPayload | null {
	try {
		const raw = sessionStorage.getItem(PAY_REDIRECT_STORAGE_KEY);
		if (!raw) return null;
		const data = JSON.parse(raw) as PayRedirectPayload;
		sessionStorage.removeItem(PAY_REDIRECT_STORAGE_KEY);
		return data;
	} catch {
		return null;
	}
}

export const Route = createFileRoute("/pay/redirect/success")({
	validateSearch: (search: Record<string, unknown>) => ({
		token: typeof search.token === "string" ? search.token : undefined,
	}),
	component: PayRedirectSuccessPage,
});

function PayRedirectSuccessPage() {
	const { token } = Route.useSearch();
	const checkout = useSessionCheckout(token ?? null);
	const payEqualPartSlotsByCountMutation = useConvexMutation(api.sessionEqualParts.payEqualPartSlotsByCount);
	const payAmountSlotMutation = useConvexMutation(api.sessionSplitByAmount.payAmountSlot);
	const payloadRef = useRef<PayRedirectPayload | null>(null);
	const [paidAmount, setPaidAmount] = useState(0);

	if (payloadRef.current === null) {
		payloadRef.current = getRedirectPayload();
	}

	useEffect(() => {
		const payload = payloadRef.current;
		if (!token || !payload || !checkout.session) return;
		const run = async () => {
			if (payload.paymentType === "by_amount" && payload.sessionSplitByAmountSlotId) {
				await payAmountSlotMutation({
					accessToken: token,
					sessionSplitByAmountSlotId: payload.sessionSplitByAmountSlotId as Id<"sessionSplitByAmountSlots">,
					amount: payload.amount,
					currency: payload.currency,
					status: payload.status,
					clientId: checkout.clientId,
				});
			} else if (payload.paymentType === "equal_parts" && payload.partsToPay != null) {
				await payEqualPartSlotsByCountMutation({
					accessToken: token,
					partsToPay: payload.partsToPay,
					amount: payload.amount,
					currency: payload.currency,
					status: payload.status,
					clientId: checkout.clientId,
				});
			} else {
				checkout.confirmPayment({
					amount: payload.amount,
					currency: payload.currency,
					status: payload.status,
				});
			}
			setPaidAmount(payload.amount);
		};
		run();
		payloadRef.current = null;
	}, [token, checkout.session, checkout.clientId, checkout.confirmPayment, payEqualPartSlotsByCountMutation, payAmountSlotMutation]);

	return (
		<MobileContainer className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
			<PageHeader title="Pagar" subtitle="Pago con Fintoc (redirect)" />
			<main className="mx-auto max-w-lg px-4 py-12 text-center space-y-6">
				<div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
					<p className="text-5xl mb-4">✓</p>
					<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
						Pago exitoso
					</h2>
					<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
						{paidAmount > 0
							? `Total pagado: $${paidAmount.toLocaleString("es-CL")} CLP`
							: "Gracias por pagar. Volviste desde la página de Fintoc (flujo redirect)."}
					</p>
				</div>
				{token ? (
					<Link to="/pay" search={{ token }}>
						<CustomButton className="w-full">Volver a la cuenta</CustomButton>
					</Link>
				) : (
					<Link to="/">
						<CustomButton className="w-full">Ir al inicio</CustomButton>
					</Link>
				)}
			</main>
		</MobileContainer>
	);
}
