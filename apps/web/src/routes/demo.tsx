/**
 * Demo Payment Flow
 *
 * Hero Bill → [Dividir → Split] → Propina → Pago con Fintoc (monto real).
 * Por defecto usa el flujo Widget: al pulsar "Pagar" se crea una sesión y se abre
 * el widget en la misma página. También disponible el flujo Redirect (redirect_url)
 * y las rutas de retorno /demo/redirect/success y /demo/redirect/cancel.
 */

import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@pay-in-table-repository/backend/convex/_generated/api";
import { MobileContainer, PageHeader } from "@/components/design-system/layout";
import { HeroBillView } from "@/components/payment/hero-bill";
import { TipSelectorView } from "@/components/payment/tip-selector";
import { FloatingPaymentPanel } from "@/components/payment/checkout";
import { FintocCheckout } from "@/components/payment/fintoc";
import { ItemSelectorContainer, type SplitItem } from "@/components/payment/item-selector";
import { QuantityPill } from "@/components/payment/quantity-pill";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CustomButton } from "@/components/design-system/ui/custom-button";
import { calculateTax } from "@/lib/utils/validation";
import { DEMO_LOGO_DATA_URL } from "@/lib/constants/demo-assets";
import { IVA_INCLUDED, DEFAULT_TIP_PERCENTAGE } from "@/lib/constants/payment";

type DemoView = "hero" | "split" | "tip" | "success";

// Datos demo en CLP (sin backend)
const DEMO_BILL = {
	restaurantName: "La Birra Bar",
	establishmentYear: "2020",
	address: "Av. Principal 123",
	phone: "+56 9 1234 5678",
	tableNumber: 1,
	serverName: "María S.",
	date: new Date().toLocaleDateString("es-CL", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}),
	orderNumber: "4821",
	items: [
		{ name: "WTF! (Doble)", quantity: 2, price: 13500 },
		{ name: "Boedo Doble", quantity: 1, price: 10900 },
		{ name: "Coca Cola Zero 350cc", quantity: 2, price: 1900 },
	],
} as const;

const subtotalDemo =
	DEMO_BILL.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
// Chile: IVA incluido en precios; no se suma IVA al total
const taxDemo = IVA_INCLUDED ? 0 : calculateTax(subtotalDemo);
const totalBillDemo = subtotalDemo + taxDemo;
const taxRateDemo = IVA_INCLUDED ? 0 : (subtotalDemo > 0 ? taxDemo / subtotalDemo : 0.19);

/** Items para la vista Dividir (split) en formato SplitItem (quantity selector) */
const DEMO_SPLIT_ITEMS: SplitItem[] = DEMO_BILL.items.map((item, index) => ({
	id: `item-${index + 1}`,
	text: item.name,
	price: item.price,
	selectedByMe: 0,
	maxSelectable: item.quantity,
	disabled: false,
}));

export const Route = createFileRoute("/demo")({
	component: DemoPage,
});

function DemoPage() {
	const routerState = useRouterState({ select: (s) => s.location });
	const isChildRoute =
		routerState.pathname === "/demo/redirect/success" ||
		routerState.pathname === "/demo/redirect/cancel";

	const [view, setView] = useState<DemoView>("hero");
	const [currentTip, setCurrentTip] = useState(0);
	const [selectedPreset, setSelectedPreset] = useState<number | null>(DEFAULT_TIP_PERCENTAGE);
	const [customTipAmount, setCustomTipAmount] = useState("");
	const [checkoutLoading, setCheckoutLoading] = useState(false);
	/** Mensaje de error al crear sesión Fintoc (Convex/Fintoc no disponible) */
	const [checkoutError, setCheckoutError] = useState<string | null>(null);
	/** Token de sesión Fintoc (flujo widget); cuando está definido se abre el widget */
	const [fintocSessionToken, setFintocSessionToken] = useState<string | null>(null);
	/** Cuando viene de Dividir: subtotal y tax de los items seleccionados */
	const [splitSubtotal, setSplitSubtotal] = useState<number | null>(null);
	const [splitTax, setSplitTax] = useState<number | null>(null);
	// Por partes iguales
	const [totalParts, setTotalParts] = useState(5);
	const [partsToPay, setPartsToPay] = useState(3);
	const [splitTab, setSplitTab] = useState<"items" | "equal" | "amount">("items");

	const createFintocSession = useConvexAction(api.fintoc.createFintocCheckoutSession);

	const ACTION_TIMEOUT_MS = 15_000;

	const effectiveSubtotal = splitSubtotal ?? subtotalDemo;
	const effectiveTax = splitTax ?? taxDemo;
	const effectiveBillTotal = effectiveSubtotal + effectiveTax;
	const totalToPay = effectiveBillTotal + currentTip;

	const handlePresetSelect = useCallback((percentage: number) => {
		setSelectedPreset(percentage);
		setCustomTipAmount("");
		setCurrentTip(Math.round(effectiveSubtotal * (percentage / 100)));
	}, [effectiveSubtotal]);

	const handleCustomTipChange = useCallback((value: string) => {
		setCustomTipAmount(value);
		setSelectedPreset(null);
		const parsed = parseInt(value.replace(/\D/g, ""), 10);
		setCurrentTip(Number.isNaN(parsed) ? 0 : parsed);
	}, []);

	const handleGoToTip = useCallback(() => {
		setCurrentTip(Math.round(effectiveSubtotal * (DEFAULT_TIP_PERCENTAGE / 100)));
		setSelectedPreset(DEFAULT_TIP_PERCENTAGE);
		setView("tip");
	}, [effectiveSubtotal]);

	const handleSplitPayNow = useCallback(
		(selectedItems: SplitItem[], _total: number) => {
			const subtotal = selectedItems.reduce(
				(s, i) => s + i.price * i.selectedByMe,
				0
			);
			const tax = IVA_INCLUDED ? 0 : Math.round(subtotal * taxRateDemo);
			setSplitSubtotal(subtotal);
			setSplitTax(tax);
			setCurrentTip(Math.round(subtotal * (DEFAULT_TIP_PERCENTAGE / 100)));
			setSelectedPreset(DEFAULT_TIP_PERCENTAGE);
			setView("tip");
		},
		[]
	);

	const handleEqualPartsContinue = useCallback(() => {
		if (totalParts <= 0) return;
		const subtotal = Math.round(totalBillDemo * (partsToPay / totalParts));
		const tax = IVA_INCLUDED ? 0 : Math.round(subtotal * taxRateDemo);
		setSplitSubtotal(subtotal);
		setSplitTax(tax);
		setCurrentTip(Math.round(subtotal * (DEFAULT_TIP_PERCENTAGE / 100)));
		setSelectedPreset(DEFAULT_TIP_PERCENTAGE);
		setView("tip");
	}, [totalParts, partsToPay]);

	/** Demo: crea sesión Fintoc con el monto real y abre el widget */
	const handlePayNow = useCallback(async () => {
		setCheckoutError(null);
		setCheckoutLoading(true);
		const baseUrl =
			typeof window !== "undefined" ? `${window.location.origin}/demo/redirect` : "";
		const amountClp = Math.round(totalToPay);
		try {
			const result = await Promise.race([
				createFintocSession({
					amount: amountClp,
					successUrl: `${baseUrl}/success`,
					cancelUrl: `${baseUrl}/cancel`,
				}),
				new Promise<never>((_, reject) =>
					setTimeout(
						() => reject(new Error("timeout")),
						ACTION_TIMEOUT_MS
					)
				),
			]);
			if (result?.session_token) {
				// Por defecto: flujo Widget – abrir checkout en la misma página
				setFintocSessionToken(result.session_token);
			} else if (result?.redirect_url) {
				// Alternativa: flujo Redirect – ir a la página de pago de Fintoc
				window.location.href = result.redirect_url;
			} else {
				setCheckoutLoading(false);
			}
		} catch (err) {
			console.error("[Demo] Fintoc session error:", err);
			setCheckoutLoading(false);
			const msg =
				err instanceof Error && err.message === "timeout"
					? "Tiempo de espera agotado. ¿Tienes Convex dev en ejecución (bunx convex dev) y FINTOC_SECRET_KEY en el dashboard?"
					: "No se pudo conectar. Revisa que Convex dev esté corriendo y FINTOC_SECRET_KEY esté configurado.";
			setCheckoutError(msg);
		}
	}, [createFintocSession, totalToPay]);

	const handleBackFromTip = useCallback(() => {
		setView(splitSubtotal != null ? "split" : "hero");
	}, [splitSubtotal]);

	const handleBackFromSplit = useCallback(() => setView("hero"), []);

	const handleRestart = useCallback(() => {
		setView("hero");
		setCurrentTip(0);
		setSelectedPreset(DEFAULT_TIP_PERCENTAGE);
		setCustomTipAmount("");
		setCheckoutLoading(false);
		setCheckoutError(null);
		setFintocSessionToken(null);
		setSplitSubtotal(null);
		setSplitTax(null);
	}, []);

	const handleFintocSuccess = useCallback(() => {
		setFintocSessionToken(null);
		setCheckoutLoading(false);
		setView("success");
	}, []);

	const handleFintocExit = useCallback(() => {
		setFintocSessionToken(null);
		setCheckoutLoading(false);
	}, []);

	if (isChildRoute) {
		return <Outlet />;
	}

	// Vista: Éxito
	if (view === "success") {
		return (
			<MobileContainer className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
				<PageHeader title="Demo" subtitle="Pago con Fintoc" />
				<main className="mx-auto max-w-lg px-4 py-12 text-center space-y-6">
					<div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
						<p className="text-5xl mb-4">✓</p>
						<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
							Pago exitoso
						</h2>
						<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
							Total pagado: ${totalToPay.toLocaleString("es-CL")} CLP
						</p>
					</div>
					<CustomButton onClick={handleRestart} className="w-full">
						Volver a iniciar demo
					</CustomButton>
				</main>
			</MobileContainer>
		);
	}

	// Vista: Dividir (seleccionar items a pagar)
	if (view === "split") {
		return (
			<div className="min-h-screen bg-zinc-50 pb-32 dark:bg-zinc-950">
				<PageHeader
					title="Dividir cuenta"
					subtitle="Mesa 1"
					onBack={handleBackFromSplit}
				/>
				<main className="mx-auto max-w-lg px-4 py-6">
					<div className="mb-4 text-center">
						<div className="mb-2 flex items-center justify-center gap-2">
							<div className="size-6 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)]" />
							<span className="text-sm font-medium text-zinc-900 dark:text-white">
								{DEMO_BILL.restaurantName}
							</span>
						</div>
						<p className="text-xs text-zinc-500 dark:text-zinc-400">
							{DEMO_BILL.date} · {DEMO_BILL.serverName}
						</p>
					</div>
					<Tabs value={splitTab} onValueChange={(v) => setSplitTab(v as "items" | "equal" | "amount")} className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="items">Por ítems</TabsTrigger>
							<TabsTrigger value="equal">Por partes</TabsTrigger>
							<TabsTrigger value="amount">Por monto</TabsTrigger>
						</TabsList>
						<TabsContent value="items" className="mt-3">
							<p className="mb-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
								Selecciona los items que quieres pagar
							</p>
							<div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
								<ItemSelectorContainer
									initialItems={DEMO_SPLIT_ITEMS}
									taxRate={taxRateDemo}
									onPayNow={handleSplitPayNow}
									label="Continuar"
								/>
							</div>
						</TabsContent>
						<TabsContent value="equal" className="mt-3">
							<p className="mb-4 text-left text-xs text-zinc-500 dark:text-zinc-400">
								Divide el total en partes iguales y elige cuántas pagas
							</p>
							<div className="mb-4">
								<div className="mb-1.5 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
									<span>Fracción a pagar</span>
									<span>{partsToPay} / {totalParts}</span>
								</div>
								<Progress value={totalParts > 0 ? (partsToPay / totalParts) * 100 : 0} className="h-2" />
							</div>
							<div className="flex justify-center rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
								<div className="flex flex-col gap-4 w-max items-start">
									<QuantityPill
										value={totalParts}
										min={1}
										max={20}
										onIncrement={() => setTotalParts((p) => Math.min(20, p + 1))}
										onDecrement={() => {
											setTotalParts((p) => Math.max(1, p - 1));
											setPartsToPay((pay) => Math.min(pay, totalParts - 1));
										}}
										label="partes totales"
										aria-label="Partes en que se divide la cuenta"
									/>
									<QuantityPill
										value={partsToPay}
										min={1}
										max={totalParts}
										onIncrement={() => setPartsToPay((p) => Math.min(totalParts, p + 1))}
										onDecrement={() => setPartsToPay((p) => Math.max(1, p - 1))}
										label="tú pagas"
										aria-label="Partes que tú pagas"
									/>
								</div>
							</div>
						</TabsContent>
						<TabsContent value="amount" className="mt-3">
							<p className="mb-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
								Indica el monto que quieres pagar
							</p>
							<div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
								<p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
									Próximamente: división por monto
								</p>
							</div>
						</TabsContent>
					</Tabs>
					{splitTab === "equal" && partsToPay > 0 && (
						<div className="fixed bottom-0 left-0 right-0 z-10 p-4 bg-white/95 dark:bg-zinc-900/95 border-t border-zinc-200 dark:border-zinc-800">
							<FloatingPaymentPanel
								selectedCount={0}
								subtotal={Math.round(totalBillDemo * (partsToPay / totalParts))}
								tax={IVA_INCLUDED ? 0 : Math.round(totalBillDemo * (partsToPay / totalParts) * taxRateDemo)}
								total={Math.round(totalBillDemo * (partsToPay / totalParts))}
								onPayNow={handleEqualPartsContinue}
								label="Continuar"
								alwaysVisible
								subtitle={`${partsToPay} de ${totalParts} partes`}
							/>
						</div>
					)}
				</main>
			</div>
		);
	}

	// Vista: Hero Bill
	if (view === "hero") {
		return (
			<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
				<HeroBillView
					restaurantName={DEMO_BILL.restaurantName}
					establishmentYear={DEMO_BILL.establishmentYear}
					address={DEMO_BILL.address}
					phone={DEMO_BILL.phone}
					tableNumber={DEMO_BILL.tableNumber}
					serverName={DEMO_BILL.serverName}
					date={DEMO_BILL.date}
					orderNumber={DEMO_BILL.orderNumber}
					items={DEMO_BILL.items.map((i) => ({
						name: i.name,
						quantity: i.quantity,
						price: i.price,
					}))}
					subtotal={subtotalDemo}
					tax={taxDemo}
					total={totalBillDemo}
					onPay={handleGoToTip}
					onSplit={() => setView("split")}
					showActions
					logoUrl={DEMO_LOGO_DATA_URL}
				/>
			</div>
		);
	}

	// Vista: Tip (Agrega propina + panel Pagar → Fintoc monto real)
	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
			<FintocCheckout
				sessionToken={fintocSessionToken}
				onSuccess={handleFintocSuccess}
				onExit={handleFintocExit}
			/>
			<PageHeader
				title="Demo — Mesa 1"
				subtitle="Agrega propina"
				onBack={handleBackFromTip}
			/>

			<main className="mx-auto max-w-lg px-4 py-6 pb-28 space-y-6">
				{checkoutError && (
					<div
						className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
						role="alert"
					>
						{checkoutError}
					</div>
				)}
				<TipSelectorView
					subtotal={effectiveSubtotal}
					currentTip={currentTip}
					selectedPreset={selectedPreset}
					customAmount={customTipAmount}
					onPresetSelect={handlePresetSelect}
					onCustomAmountChange={handleCustomTipChange}
				/>
				<FloatingPaymentPanel
					selectedCount={1}
					subtotal={effectiveSubtotal}
					tax={effectiveTax}
					total={totalToPay}
					onPayNow={handlePayNow}
					label="Pagar"
					alwaysVisible
					isLoading={checkoutLoading}
				/>
			</main>
		</div>
	);
}
