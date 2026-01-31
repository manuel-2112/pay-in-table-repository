/**
 * Pay redirect – success return URL.
 * Fintoc redirects here after successful payment. Read token from search,
 * restore amount from sessionStorage, call confirmPayment, then show success.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MobileContainer, PageHeader } from "@/components/design-system/layout";
import { CustomButton } from "@/components/design-system/ui/custom-button";
import { useSessionCheckout } from "@/lib/xstate";

const PAY_REDIRECT_STORAGE_KEY = "payRedirect";

function getRedirectPayload(): { amount: number; currency: string; status: string } | null {
	try {
		const raw = sessionStorage.getItem(PAY_REDIRECT_STORAGE_KEY);
		if (!raw) return null;
		const data = JSON.parse(raw) as { amount: number; currency: string; status: string };
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
	const payloadRef = useRef<{ amount: number; currency: string; status: string } | null>(null);
	const [paidAmount, setPaidAmount] = useState(0);

	if (payloadRef.current === null) {
		payloadRef.current = getRedirectPayload();
	}

	useEffect(() => {
		const payload = payloadRef.current;
		if (!token || !payload || !checkout.session) return;
		checkout.confirmPayment({
			amount: payload.amount,
			currency: payload.currency,
			status: payload.status,
		});
		setPaidAmount(payload.amount);
		payloadRef.current = null;
	}, [token, checkout.session, checkout.confirmPayment]);

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
