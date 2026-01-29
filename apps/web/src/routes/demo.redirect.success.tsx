/**
 * Fintoc Redirect flow – success return URL.
 * Fintoc redirects here after successful payment.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileContainer, PageHeader } from "@/components/design-system/layout";
import { CustomButton } from "@/components/design-system/ui/custom-button";

export const Route = createFileRoute("/demo/redirect/success")({
	component: DemoRedirectSuccessPage,
});

function DemoRedirectSuccessPage() {
	return (
		<MobileContainer className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
			<PageHeader title="Demo" subtitle="Pago con Fintoc (redirect)" />
			<main className="mx-auto max-w-lg px-4 py-12 text-center space-y-6">
				<div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
					<p className="text-5xl mb-4">✓</p>
					<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
						Pago exitoso
					</h2>
					<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
						Gracias por pagar. Volviste desde la página de Fintoc (flujo redirect).
					</p>
				</div>
				<Link to="/demo">
					<CustomButton className="w-full">Volver al demo</CustomButton>
				</Link>
			</main>
		</MobileContainer>
	);
}
