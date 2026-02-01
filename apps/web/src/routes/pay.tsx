/**
 * Pay by table token – same flow as demo: Hero → Dividir → Propina → Fintoc → Éxito.
 * Data from useSessionCheckout(token); "Dividir" = reserve/release items.
 */

import { createFileRoute, Outlet, useRouterState, Link } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { useConvexAction, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@pay-in-table-repository/backend/convex/_generated/api";
import { MobileContainer, PageHeader } from "@/components/design-system/layout";
import { HeroBillView } from "@/components/payment/hero-bill";
import { TipSelectorView } from "@/components/payment/tip-selector";
import { FloatingPaymentPanel } from "@/components/payment/checkout";
import { FintocCheckout } from "@/components/payment/fintoc";
import { ItemSelectorList } from "@/components/payment/item-selector";
import { CustomButton } from "@/components/design-system/ui/custom-button";
import { useSessionCheckout } from "@/lib/xstate";
import { DEFAULT_TIP_PERCENTAGE } from "@/lib/constants/payment";
import type { Id } from "@pay-in-table-repository/backend/convex/_generated/dataModel";

type PayView = "hero" | "split" | "tip" | "success";

const PAY_REDIRECT_STORAGE_KEY = "payRedirect";

function saveRedirectPayload(amount: number, currency: string, status: string) {
	try {
		sessionStorage.setItem(
			PAY_REDIRECT_STORAGE_KEY,
			JSON.stringify({ amount, currency, status })
		);
	} catch {
		// ignore
	}
}

export const Route = createFileRoute("/pay")({
	validateSearch: (search: Record<string, unknown>) => ({
		token: typeof search.token === "string" ? search.token : undefined,
	}),
	component: PayPage,
});

function PayPage() {
	const { token } = Route.useSearch();
	const routerState = useRouterState({ select: (s) => s.location });
	const isChildRoute =
		routerState.pathname === "/pay/redirect/success" ||
		routerState.pathname === "/pay/redirect/cancel";

	const checkout = useSessionCheckout(token ?? null);
	const createFintocSession = useConvexAction(api.fintoc.createFintocCheckoutSession);
	const seedItemsForTable = useConvexMutation(api.seed.seedItemsForTableByToken);

	const [view, setView] = useState<PayView>("hero");
	const [currentTip, setCurrentTip] = useState(0);
	const [selectedPreset, setSelectedPreset] = useState<number | null>(DEFAULT_TIP_PERCENTAGE);
	const [customTipAmount, setCustomTipAmount] = useState("");
	const [checkoutLoading, setCheckoutLoading] = useState(false);
	const [checkoutError, setCheckoutError] = useState<string | null>(null);
	const [fintocSessionToken, setFintocSessionToken] = useState<string | null>(null);
	const [paidTotal, setPaidTotal] = useState(0);
	const [seedItemsLoading, setSeedItemsLoading] = useState(false);
	const [seedItemsError, setSeedItemsError] = useState<string | null>(null);

	const ACTION_TIMEOUT_MS = 15_000;

	const reservedSubtotal = checkout.coordinatorSnapshot.context.totalToPayCents;
	const effectiveSubtotal = reservedSubtotal;
	const effectiveTax = 0;
	const totalToPay = effectiveSubtotal + currentTip;

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

	const handleBackFromTip = useCallback(() => {
		setView(reservedSubtotal > 0 ? "split" : "hero");
	}, [reservedSubtotal]);

	const handleBackFromSplit = useCallback(() => setView("hero"), []);

	const handlePayAll = useCallback(() => {
		checkout.items.forEach(({ row, snapshot }) => {
			if (snapshot.value === "available") checkout.reserve(row._id);
		});
		setCurrentTip(Math.round(effectiveSubtotal * (DEFAULT_TIP_PERCENTAGE / 100)));
		setSelectedPreset(DEFAULT_TIP_PERCENTAGE);
		setView("tip");
	}, [checkout.items, checkout.reserve, effectiveSubtotal]);

	const splitItems = useMemo(() => {
		const byGroup = new Map<
			string,
			{
				name: string;
				price: number;
				availableIds: Id<"sessionItems">[];
				reservedByMeIds: Id<"sessionItems">[];
				totalCount: number;
				reservedByOthersOrPaid: number;
			}
		>();
		for (const { row, snapshot } of checkout.items) {
			const key = `${row.name}|${row.price}`;
			if (!byGroup.has(key)) {
				byGroup.set(key, {
					name: row.name,
					price: row.price,
					availableIds: [],
					reservedByMeIds: [],
					totalCount: 0,
					reservedByOthersOrPaid: 0,
				});
			}
			const g = byGroup.get(key)!;
			g.totalCount++;
			if (row.status === "available") {
				g.availableIds.push(row._id);
			} else if (
				row.status === "reserved" &&
				snapshot.context.reservedByClientId === checkout.clientId
			) {
				g.reservedByMeIds.push(row._id);
			} else if (
				row.status === "paid" ||
				(row.status === "reserved" &&
					snapshot.context.reservedByClientId !== checkout.clientId)
			) {
				g.reservedByOthersOrPaid++;
			}
		}
		return Array.from(byGroup.entries()).map(([groupKey, g]) => {
			const selectedByMe = g.reservedByMeIds.length;
			const maxSelectable = g.totalCount - g.reservedByOthersOrPaid;
			return {
				id: groupKey,
				groupKey,
				text: g.name,
				price: g.price,
				selectedByMe,
				maxSelectable,
				disabled: maxSelectable === 0,
				availableIds: g.availableIds,
				reservedByMeIds: g.reservedByMeIds,
			};
		});
	}, [checkout.items, checkout.clientId]);

	const handleSplitIncrement = useCallback(
		(groupKey: string) => {
			const group = splitItems.find((i) => i.groupKey === groupKey);
			if (!group || group.availableIds.length === 0) return;
			checkout.reserve(group.availableIds[0]);
		},
		[splitItems, checkout.reserve]
	);

	const handleSplitDecrement = useCallback(
		(groupKey: string) => {
			const group = splitItems.find((i) => i.groupKey === groupKey);
			if (!group || group.reservedByMeIds.length === 0) return;
			checkout.release(group.reservedByMeIds[0]);
		},
		[splitItems, checkout.release]
	);

	const handleSplitContinue = useCallback(() => {
		setCurrentTip(Math.round(reservedSubtotal * (DEFAULT_TIP_PERCENTAGE / 100)));
		setSelectedPreset(DEFAULT_TIP_PERCENTAGE);
		setView("tip");
	}, [reservedSubtotal]);

	const handlePayNow = useCallback(async () => {
		setCheckoutError(null);
		setCheckoutLoading(true);
		const baseUrl =
			typeof window !== "undefined" ? `${window.location.origin}/pay/redirect` : "";
		const amountClp = Math.round(totalToPay);
		saveRedirectPayload(amountClp, "CLP", "succeeded");
		try {
			const result = await Promise.race([
				createFintocSession({
					amount: amountClp,
					successUrl: `${baseUrl}/success${token ? `?token=${encodeURIComponent(token)}` : ""}`,
					cancelUrl: `${baseUrl}/cancel${token ? `?token=${encodeURIComponent(token)}` : ""}`,
				}),
				new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error("timeout")), ACTION_TIMEOUT_MS)
				),
			]);
			if (result?.session_token) {
				setFintocSessionToken(result.session_token);
			} else if (result?.redirect_url) {
				window.location.href = result.redirect_url;
			} else {
				setCheckoutLoading(false);
			}
		} catch (err) {
			console.error("[Pay] Fintoc session error:", err);
			setCheckoutLoading(false);
			const msg =
				err instanceof Error && err.message === "timeout"
					? "Tiempo de espera agotado. ¿Convex dev y FINTOC_SECRET_KEY configurados?"
					: "No se pudo conectar. Revisa Convex dev y FINTOC_SECRET_KEY.";
			setCheckoutError(msg);
		}
	}, [createFintocSession, totalToPay, token]);

	const handleFintocSuccess = useCallback(() => {
		setFintocSessionToken(null);
		setCheckoutLoading(false);
		checkout.confirmPayment({
			amount: Math.round(totalToPay),
			currency: "CLP",
			status: "succeeded",
		});
		setPaidTotal(totalToPay);
		setView("success");
	}, [checkout, totalToPay]);

	const handleFintocExit = useCallback(() => {
		setFintocSessionToken(null);
		setCheckoutLoading(false);
	}, []);

	const handleRestart = useCallback(() => {
		setView("hero");
		setCurrentTip(0);
		setSelectedPreset(DEFAULT_TIP_PERCENTAGE);
		setCustomTipAmount("");
		setCheckoutLoading(false);
		setCheckoutError(null);
		setFintocSessionToken(null);
	}, []);

	if (isChildRoute) {
		return <Outlet />;
	}

	if (!token) {
		return (
			<MobileContainer className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
				<PageHeader title="Pagar" subtitle="Cuenta por mesa" />
				<main className="mx-auto max-w-lg px-4 py-12 text-center space-y-6">
					<p className="text-zinc-600 dark:text-zinc-400">
						Falta el token de la mesa. Abre el enlace del QR o escanea el código de la mesa.
					</p>
					<Link to="/">
						<CustomButton className="w-full">Ir al inicio</CustomButton>
					</Link>
				</main>
			</MobileContainer>
		);
	}

	if (checkout.isLoading) {
		return (
			<MobileContainer className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
				<PageHeader title="Pagar" subtitle="Cuenta por mesa" />
				<main className="mx-auto max-w-lg px-4 py-12 text-center">
					<p className="text-zinc-500 dark:text-zinc-400">Cargando cuenta...</p>
				</main>
			</MobileContainer>
		);
	}

	if (!checkout.session && !checkout.isLoading) {
		return (
			<MobileContainer className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
				<PageHeader title="Pagar" subtitle="Cuenta por mesa" />
				<main className="mx-auto max-w-lg px-4 py-12 text-center space-y-6">
					<p className="text-zinc-600 dark:text-zinc-400">
						No hay cuenta activa para esta mesa.
					</p>
					<Link to="/">
						<CustomButton className="w-full">Ir al inicio</CustomButton>
					</Link>
				</main>
			</MobileContainer>
		);
	}

	// Sesión activa pero sin ítems: ofrecer añadir ítems de prueba
	if (checkout.session && checkout.items.length === 0) {
		const handleAddDemoItems = async () => {
			if (!token) return;
			setSeedItemsError(null);
			setSeedItemsLoading(true);
			try {
				await seedItemsForTable({ accessToken: token });
			} catch (err) {
				setSeedItemsError(
					err instanceof Error ? err.message : "No se pudieron añadir ítems"
				);
			} finally {
				setSeedItemsLoading(false);
			}
		};
		return (
			<MobileContainer className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
				<PageHeader title="Pagar" subtitle={checkout.table?.label ?? "Mesa"} />
				<main className="mx-auto max-w-lg px-4 py-12 text-center space-y-6">
					<p className="text-zinc-600 dark:text-zinc-400">
						No hay ítems en esta cuenta. Puedes añadir ítems de prueba para probar el flujo de pago.
					</p>
					{seedItemsError && (
						<p className="text-sm text-amber-600 dark:text-amber-400" role="alert">
							{seedItemsError}
						</p>
					)}
					<CustomButton
						onClick={handleAddDemoItems}
						disabled={seedItemsLoading}
						className="w-full"
					>
						{seedItemsLoading ? "Añadiendo…" : "Añadir ítems de prueba"}
					</CustomButton>
					<Link to="/">
						<CustomButton variant="outline" className="w-full">
							Ir al inicio
						</CustomButton>
					</Link>
				</main>
			</MobileContainer>
		);
	}

	const tableLabel = checkout.table?.label ?? "Mesa";
	const subtotal =
		checkout.items.reduce((s, x) => s + x.row.price * x.row.quantity, 0) ?? 0;
	const total = checkout.session?.totalAmountCents ?? subtotal;
	const billItems = checkout.items.map((x) => ({
		name: x.row.name,
		quantity: x.row.quantity,
		price: x.row.price,
		disabled:
			x.row.status === "paid" ||
			(x.row.status === "reserved" &&
				x.snapshot.context.reservedByClientId !== checkout.clientId),
	}));

	if (view === "success") {
		return (
			<MobileContainer className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
				<PageHeader title="Pagar" subtitle={tableLabel} />
				<main className="mx-auto max-w-lg px-4 py-12 text-center space-y-6">
					<div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
						<p className="text-5xl mb-4">✓</p>
						<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
							Pago exitoso
						</h2>
						<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
							Total pagado: ${paidTotal.toLocaleString("es-CL")} CLP
						</p>
					</div>
					<Link to="/pay" search={{ token }}>
						<CustomButton onClick={handleRestart} className="w-full">
							Volver a la cuenta
						</CustomButton>
					</Link>
				</main>
			</MobileContainer>
		);
	}

	if (view === "split") {
		const reservedCount = splitItems.reduce((sum, i) => sum + i.selectedByMe, 0);
		return (
			<div className="min-h-screen bg-zinc-50 pb-32 dark:bg-zinc-950">
				<PageHeader
					title="Dividir cuenta"
					subtitle={tableLabel}
					onBack={handleBackFromSplit}
				/>
				<main className="mx-auto max-w-lg px-4 py-6">
					<p className="mb-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
						Selecciona los ítems que quieres pagar
					</p>
					<div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
						<ItemSelectorList
							items={splitItems}
							onIncrement={handleSplitIncrement}
							onDecrement={handleSplitDecrement}
						/>
					</div>
					{reservedCount > 0 && (
						<div className="fixed bottom-0 left-0 right-0 z-10 p-4 bg-white/95 dark:bg-zinc-900/95 border-t border-zinc-200 dark:border-zinc-800">
							<FloatingPaymentPanel
								selectedCount={reservedCount}
								subtotal={reservedSubtotal}
								tax={0}
								total={reservedSubtotal}
								onPayNow={handleSplitContinue}
								label="Continuar"
								alwaysVisible
							/>
						</div>
					)}
				</main>
			</div>
		);
	}

	if (view === "hero") {
		return (
			<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
				<HeroBillView
					restaurantName="Cuenta"
					establishmentYear=""
					tableNumber={1}
					serverName="—"
					date={new Date().toLocaleDateString("es-CL", {
						day: "numeric",
						month: "short",
						year: "numeric",
					})}
					orderNumber="—"
					items={billItems}
					subtotal={subtotal}
					tax={0}
					total={total}
					onPay={handlePayAll}
					onSplit={() => setView("split")}
					showActions
				/>
			</div>
		);
	}

	// Vista: Tip
	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
			<FintocCheckout
				sessionToken={fintocSessionToken}
				onSuccess={handleFintocSuccess}
				onExit={handleFintocExit}
			/>
			<PageHeader
				title={`Pagar — ${tableLabel}`}
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
