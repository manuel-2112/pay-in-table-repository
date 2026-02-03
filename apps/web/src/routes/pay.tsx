/**
 * Pay by table token – same flow as demo: Hero → Dividir → Propina → Fintoc → Éxito.
 * Data from useSessionCheckout(token); "Dividir" = reserve/release items.
 */

import { createFileRoute, Outlet, useRouterState, Link } from "@tanstack/react-router";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useConvexAction, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@pay-in-table-repository/backend/convex/_generated/api";
import { MobileContainer, PageHeader } from "@/components/design-system/layout";
import { HeroBillView } from "@/components/payment/hero-bill";
import { TipSelectorView } from "@/components/payment/tip-selector";
import { FloatingPaymentPanel } from "@/components/payment/checkout";
import { FintocCheckout } from "@/components/payment/fintoc";
import { ItemSelectorList } from "@/components/payment/item-selector";
import { QuantityPill } from "@/components/payment/quantity-pill";
import { Progress } from "@/components/ui/progress";
import { CustomButton } from "@/components/design-system/ui/custom-button";
import { ChevronRight, Loader2 } from "lucide-react";
import { useSessionCheckout } from "@/lib/xstate";
import { DEFAULT_TIP_PERCENTAGE } from "@/lib/constants/payment";
import type { Id } from "@pay-in-table-repository/backend/convex/_generated/dataModel";

type PayView = "hero" | "splitMethodChoice" | "split" | "tip" | "success";

type SplitMode = "items" | "equal_parts" | "by_amount";

const PAY_REDIRECT_STORAGE_KEY = "payRedirect";

export type PayRedirectPayload = {
	amount: number;
	currency: string;
	status: string;
	paymentType?: "items" | "equal_parts" | "by_amount";
	partsToPay?: number;
	sessionSplitByAmountSlotId?: string;
};

function saveRedirectPayload(
	amount: number,
	currency: string,
	status: string,
	opts?: {
		paymentType?: "items" | "equal_parts" | "by_amount";
		partsToPay?: number;
		sessionSplitByAmountSlotId?: string;
	}
) {
	try {
		sessionStorage.setItem(
			PAY_REDIRECT_STORAGE_KEY,
			JSON.stringify({ amount, currency, status, ...opts })
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
	const chooseSplitModeMutation = useConvexMutation(api.sessions.chooseSplitMode);
	const clearSplitModeMutation = useConvexMutation(api.sessions.clearSplitMode);
	const createEqualPartsSplitMutation = useConvexMutation(api.sessionEqualParts.createEqualPartsSplit);
	const payEqualPartSlotsByCountMutation = useConvexMutation(api.sessionEqualParts.payEqualPartSlotsByCount);
	const addAmountSlotMutation = useConvexMutation(api.sessionSplitByAmount.addAmountSlot);
	const payAmountSlotMutation = useConvexMutation(api.sessionSplitByAmount.payAmountSlot);

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
	// Por partes iguales: total parts and parts I pay (partsToPay <= totalParts)
	const [totalParts, setTotalParts] = useState(5);
	const [partsToPay, setPartsToPay] = useState(3);
	const [equalPartsAmountCents, setEqualPartsAmountCents] = useState<number | null>(null);
	const [splitMethodChoiceLoading, setSplitMethodChoiceLoading] = useState(false);
	const [clearSplitModeLoading, setClearSplitModeLoading] = useState(false);
	// Por monto: input string (pesos), slot id and cents after Continuar
	const [amountByAmountInput, setAmountByAmountInput] = useState("");
	const [byAmountSlotId, setByAmountSlotId] = useState<Id<"sessionSplitByAmountSlots"> | null>(null);
	const [byAmountCents, setByAmountCents] = useState<number | null>(null);
	const [byAmountAddLoading, setByAmountAddLoading] = useState(false);

	const ACTION_TIMEOUT_MS = 15_000;

	const reservedSubtotal = checkout.coordinatorSnapshot.context.totalToPayCents;
	const effectiveSubtotal = byAmountCents ?? equalPartsAmountCents ?? reservedSubtotal;
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
		if (byAmountSlotId != null || byAmountCents != null) {
			setByAmountSlotId(null);
			setByAmountCents(null);
			setView("split");
			return;
		}
		setView(equalPartsAmountCents != null || reservedSubtotal > 0 ? "split" : "splitMethodChoice");
	}, [equalPartsAmountCents, reservedSubtotal, byAmountSlotId, byAmountCents]);

	const handleBackFromSplitMethodChoice = useCallback(() => {
		setView("hero");
	}, []);

	const handleBackFromSplit = useCallback(() => {
		setView("splitMethodChoice");
		setEqualPartsAmountCents(null);
		setByAmountSlotId(null);
		setByAmountCents(null);
		setAmountByAmountInput("");
	}, []);

	const sessionWithSplit = checkout.session as {
		splitMode?: SplitMode;
		splitModeChosenByClientId?: string;
	} | null;
	const splitMode = sessionWithSplit?.splitMode ?? null;
	const splitModeChosenByClientId = sessionWithSplit?.splitModeChosenByClientId ?? null;
	const isChooser = splitModeChosenByClientId != null && splitModeChosenByClientId === checkout.clientId;

	const handleChooseSplitMode = useCallback(
		async (mode: SplitMode) => {
			if (!token || splitMode != null && splitMode !== mode) return;
			setSplitMethodChoiceLoading(true);
			try {
				await chooseSplitModeMutation({
					accessToken: token,
					clientId: checkout.clientId,
					mode,
				});
				setView("split");
			} finally {
				setSplitMethodChoiceLoading(false);
			}
		},
		[token, splitMode, checkout.clientId, chooseSplitModeMutation]
	);

	const handleClearSplitMode = useCallback(async () => {
		if (!token || !isChooser) return;
		setClearSplitModeLoading(true);
		try {
			await clearSplitModeMutation({ accessToken: token, clientId: checkout.clientId });
			// splitMode will become null via reactive query; all 3 buttons become enabled again
		} catch (e) {
			console.error("[Pay] clearSplitMode failed", e);
		} finally {
			setClearSplitModeLoading(false);
		}
	}, [token, isChooser, checkout.clientId, clearSplitModeMutation]);

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

	const sessionTotalCents =
		checkout.session?.totalAmountCents ??
		checkout.items.reduce((s, x) => s + x.row.price * x.row.quantity, 0);

	const handleSplitContinue = useCallback(async () => {
		const base =
			splitMode === "equal_parts" && sessionTotalCents > 0 && totalParts > 0
				? Math.round(sessionTotalCents * (partsToPay / totalParts))
				: reservedSubtotal;
		if (splitMode === "equal_parts") {
			setEqualPartsAmountCents(base);
			if (token) {
				try {
					await createEqualPartsSplitMutation({
						accessToken: token,
						clientId: checkout.clientId,
						totalParts,
					});
				} catch (e) {
					console.error("[Pay] createEqualPartsSplit failed", e);
				}
			}
		}
		setCurrentTip(Math.round(base * (DEFAULT_TIP_PERCENTAGE / 100)));
		setSelectedPreset(DEFAULT_TIP_PERCENTAGE);
		setView("tip");
	}, [reservedSubtotal, splitMode, sessionTotalCents, totalParts, partsToPay, token, checkout.clientId, createEqualPartsSplitMutation]);

	const parsedByAmountPesos = useMemo(() => {
		const n = parseInt(amountByAmountInput.replace(/\D/g, ""), 10);
		return Number.isNaN(n) ? 0 : n;
	}, [amountByAmountInput]);

	const handleByAmountContinue = useCallback(async () => {
		const amountCents = parsedByAmountPesos * 100;
		if (!token || amountCents <= 0 || amountCents > sessionTotalCents) return;
		setByAmountAddLoading(true);
		try {
			const slotId = await addAmountSlotMutation({
				accessToken: token,
				amountCents,
			});
			setByAmountSlotId(slotId as Id<"sessionSplitByAmountSlots">);
			setByAmountCents(amountCents);
			setCurrentTip(Math.round(amountCents * (DEFAULT_TIP_PERCENTAGE / 100)));
			setSelectedPreset(DEFAULT_TIP_PERCENTAGE);
			setView("tip");
		} catch (e) {
			console.error("[Pay] addAmountSlot failed", e);
		} finally {
			setByAmountAddLoading(false);
		}
	}, [token, parsedByAmountPesos, sessionTotalCents, addAmountSlotMutation]);

	const handlePayNow = useCallback(async () => {
		setCheckoutError(null);
		setCheckoutLoading(true);
		const baseUrl =
			typeof window !== "undefined" ? `${window.location.origin}/pay/redirect` : "";
		const amountClp = Math.round(totalToPay);
		const redirectOpts =
			byAmountSlotId != null
				? { paymentType: "by_amount" as const, sessionSplitByAmountSlotId: byAmountSlotId }
				: equalPartsAmountCents != null
					? { paymentType: "equal_parts" as const, partsToPay }
					: undefined;
		saveRedirectPayload(amountClp, "CLP", "succeeded", redirectOpts);
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
	}, [createFintocSession, totalToPay, token, equalPartsAmountCents, partsToPay, byAmountSlotId]);

	const handleFintocSuccess = useCallback(async () => {
		setFintocSessionToken(null);
		setCheckoutLoading(false);
		const amount = Math.round(totalToPay);
		if (byAmountSlotId != null && token) {
			try {
				await payAmountSlotMutation({
					accessToken: token,
					sessionSplitByAmountSlotId: byAmountSlotId,
					amount,
					currency: "CLP",
					status: "succeeded",
					clientId: checkout.clientId,
				});
			} catch (e) {
				console.error("[Pay] payAmountSlot failed", e);
			}
		} else if (equalPartsAmountCents != null && token) {
			try {
				await payEqualPartSlotsByCountMutation({
					accessToken: token,
					partsToPay,
					amount,
					currency: "CLP",
					status: "succeeded",
					clientId: checkout.clientId,
				});
			} catch (e) {
				console.error("[Pay] payEqualPartSlotsByCount failed", e);
			}
		} else {
			checkout.confirmPayment({
				amount,
				currency: "CLP",
				status: "succeeded",
			});
		}
		setPaidTotal(totalToPay);
		setView("success");
	}, [checkout, totalToPay, equalPartsAmountCents, byAmountSlotId, token, partsToPay, checkout.clientId, payEqualPartSlotsByCountMutation, payAmountSlotMutation]);

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
		setEqualPartsAmountCents(null);
		setByAmountSlotId(null);
		setByAmountCents(null);
		setAmountByAmountInput("");
	}, []);

	// If user landed on split but no mode chosen yet, show method choice
	useEffect(() => {
		if (view === "split" && splitMode == null && checkout.session != null) {
			setView("splitMethodChoice");
		}
	}, [view, splitMode, checkout.session]);

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

	if (view === "splitMethodChoice") {
		const modeItemsEnabled = splitMode == null || splitMode === "items";
		const modeEqualEnabled = splitMode == null || splitMode === "equal_parts";
		const modeAmountEnabled = splitMode == null || splitMode === "by_amount";
		return (
			<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
				<PageHeader
					title="Dividir cuenta"
					subtitle={tableLabel}
					onBack={handleBackFromSplitMethodChoice}
				/>
				<main className="mx-auto max-w-lg px-4 py-6">
					<p className="mb-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
						¿Cómo quieres dividir la cuenta?
					</p>
					<div className="mx-auto flex max-w-sm flex-col gap-3">
						<div>
							<CustomButton
								variant="minimal"
								className="w-full"
								disabled={!modeItemsEnabled || splitMethodChoiceLoading}
								onClick={() => handleChooseSplitMode("items")}
							>
								<span className="text-left">Por ítems</span>
								{splitMethodChoiceLoading ? (
									<Loader2 className="h-4 w-4 shrink-0 animate-spin text-zinc-400" />
								) : (
									<ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
								)}
							</CustomButton>
						</div>
						<div>
							<CustomButton
								variant="minimal"
								className="w-full"
								disabled={!modeEqualEnabled || splitMethodChoiceLoading}
								onClick={() => handleChooseSplitMode("equal_parts")}
							>
								<span className="text-left">Por partes iguales</span>
								{splitMethodChoiceLoading ? (
									<Loader2 className="h-4 w-4 shrink-0 animate-spin text-zinc-400" />
								) : (
									<ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
								)}
							</CustomButton>
						</div>
						<div>
							<CustomButton
								variant="minimal"
								className="w-full"
								disabled={!modeAmountEnabled || splitMethodChoiceLoading}
								onClick={() => handleChooseSplitMode("by_amount")}
							>
								<span className="text-left">Por monto</span>
								{splitMethodChoiceLoading ? (
									<Loader2 className="h-4 w-4 shrink-0 animate-spin text-zinc-400" />
								) : (
									<ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
								)}
							</CustomButton>
						</div>
					</div>
					{isChooser && splitMode != null && (
						<div className="mt-6 text-center">
							<button
								type="button"
								onClick={handleClearSplitMode}
								disabled={clearSplitModeLoading}
								className="text-sm font-normal text-[var(--brand-secondary)] underline-offset-2 hover:opacity-80 hover:underline disabled:opacity-50"
							>
								{clearSplitModeLoading ? "Deshaciendo…" : "Liberar método de división"}
							</button>
							<p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
								Vuelve a dejar que cualquiera elija el método
							</p>
						</div>
					)}
				</main>
			</div>
		);
	}

	if (view === "split") {
		if (splitMode == null) {
			return null;
		}
		const reservedCount = splitItems.reduce((sum, i) => sum + i.selectedByMe, 0);
		const showPanelItems = splitMode === "items" && reservedCount > 0;
		const showPanelEqual = splitMode === "equal_parts" && partsToPay > 0;
		const byAmountCentsInput = parsedByAmountPesos * 100;
		const showPanelByAmount =
			splitMode === "by_amount" &&
			parsedByAmountPesos > 0 &&
			byAmountCentsInput <= sessionTotalCents;
		const showPanel = showPanelItems || showPanelEqual || showPanelByAmount;

		return (
			<div className="min-h-screen bg-zinc-50 pb-32 dark:bg-zinc-950">
				<PageHeader
					title="Dividir cuenta"
					subtitle={tableLabel}
					onBack={handleBackFromSplit}
				/>
				<main className="mx-auto max-w-lg px-4 py-4">
					{splitMode === "items" && (
						<>
							<p className="mb-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
								Selecciona los ítems que quieres pagar
							</p>
							<div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
								<ItemSelectorList
									items={splitItems}
									onIncrement={handleSplitIncrement}
									onDecrement={handleSplitDecrement}
								/>
							</div>
						</>
					)}
					{splitMode === "equal_parts" && (
						<>
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
						</>
					)}
					{splitMode === "by_amount" && (
						<>
							<p className="mb-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
								Indica el monto que quieres pagar (máx. ${Math.round(sessionTotalCents / 100).toLocaleString("es-CL")} CLP)
							</p>
							<div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
								<label htmlFor="by-amount-input" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
									Monto (CLP)
								</label>
								<input
									id="by-amount-input"
									type="text"
									inputMode="numeric"
									placeholder="Ej. 15000"
									value={amountByAmountInput}
									onChange={(e) => setAmountByAmountInput(e.target.value.replace(/\D/g, ""))}
									className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
								/>
								{parsedByAmountPesos > 0 && byAmountCentsInput > sessionTotalCents && (
									<p className="mt-2 text-xs text-amber-600 dark:text-amber-400" role="alert">
										El monto no puede superar el total de la cuenta.
									</p>
								)}
							</div>
						</>
					)}
					{showPanel && (
						<div className="fixed bottom-0 left-0 right-0 z-10 p-4 bg-white/95 dark:bg-zinc-900/95 border-t border-zinc-200 dark:border-zinc-800">
							<FloatingPaymentPanel
								selectedCount={splitMode === "equal_parts" ? 0 : splitMode === "by_amount" ? 1 : reservedCount}
								subtotal={
									splitMode === "by_amount"
										? byAmountCentsInput
										: splitMode === "equal_parts" && sessionTotalCents > 0 && totalParts > 0
											? Math.round(sessionTotalCents * (partsToPay / totalParts))
											: reservedSubtotal
								}
								tax={0}
								total={
									splitMode === "by_amount"
										? byAmountCentsInput
										: splitMode === "equal_parts" && sessionTotalCents > 0 && totalParts > 0
											? Math.round(sessionTotalCents * (partsToPay / totalParts))
											: reservedSubtotal
								}
								onPayNow={splitMode === "by_amount" ? handleByAmountContinue : handleSplitContinue}
								label="Continuar"
								alwaysVisible
								isLoading={splitMode === "by_amount" ? byAmountAddLoading : false}
								subtitle={splitMode === "equal_parts" ? `${partsToPay} de ${totalParts} partes` : undefined}
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
					onSplit={() => setView("splitMethodChoice")}
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
