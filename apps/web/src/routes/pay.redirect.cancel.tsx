/**
 * Pay redirect – cancel return URL.
 * Fintoc redirects here when the user cancels. Show message and link back to pay.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileContainer, PageHeader } from "@/components/design-system/layout";
import { CustomButton } from "@/components/design-system/ui/custom-button";

export const Route = createFileRoute("/pay/redirect/cancel")({
	validateSearch: (search: Record<string, unknown>) => ({
		token: typeof search.token === "string" ? search.token : undefined,
	}),
	component: PayRedirectCancelPage,
});

function PayRedirectCancelPage() {
	const { token } = Route.useSearch();

	return (
		<MobileContainer className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
			<PageHeader title="Pagar" subtitle="Pago cancelado" />
			<main className="mx-auto max-w-lg px-4 py-12 text-center space-y-6">
				<div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
					<p className="text-zinc-500 dark:text-zinc-400">El pago fue cancelado.</p>
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
