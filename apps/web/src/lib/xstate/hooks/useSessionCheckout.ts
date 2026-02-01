/**
 * Hook: table checkout by access token.
 * Generates clientId once, subscribes to getSessionByToken, creates one item machine
 * per session item, syncs Convex → item actors via SYNC_FROM_SERVER, and exposes
 * reserve / release / pay (Fintoc + markItemsAsPaid).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createActor } from "xstate";
import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query";
import { api } from "@pay-in-table-repository/backend/convex/_generated/api";
import type { Id } from "@pay-in-table-repository/backend/convex/_generated/dataModel";
import { itemMachine } from "../itemMachine";
import { checkoutCoordinatorMachine } from "../checkoutCoordinatorMachine";
import type { ItemActorSnapshot, ItemEvent, ItemStateValue, SessionItemStatus } from "../types";

export interface SessionItemRow {
	_id: Id<"sessionItems">;
	sessionId: Id<"sessions">;
	name: string;
	quantity: number;
	price: number;
	status: SessionItemStatus;
	reservedByClientId?: string;
	createdAt: number;
}

export interface SessionCheckoutResult {
	clientId: string;
	table: { _id: Id<"tables">; accessToken: string; label?: string } | null;
	session: { _id: Id<"sessions">; totalAmountCents: number; status: string } | null;
	items: Array<{ row: SessionItemRow; snapshot: ItemActorSnapshot }>;
	reserve: (sessionItemId: Id<"sessionItems">) => void;
	release: (sessionItemId: Id<"sessionItems">) => void;
		pay: (opts: {
			createFintocSession: (args: { amount: number; currency: string }) => Promise<{ clientSecret: string; redirectUrl?: string } | null>;
			onSuccess?: () => void;
			onFailure?: (error: string) => void;
		}) => void;
	/** Call after Fintoc confirms (e.g. redirect success or widget callback) */
	confirmPayment: (params: { amount: number; currency: string; status: string; fintocPaymentId?: string }) => void;
	coordinatorSnapshot: { value: string; context: { totalToPayCents: number } };
	isLoading: boolean;
}

function generateClientId(): string {
	return crypto.randomUUID();
}

export function useSessionCheckout(accessToken: string | null): SessionCheckoutResult {
	const clientIdRef = useRef<string | null>(null);
	const [clientId] = useState(() => {
		if (clientIdRef.current) return clientIdRef.current;
		clientIdRef.current = generateClientId();
		return clientIdRef.current;
	});

	const sessionData = useConvexQuery(
		api.sessions.getSessionByToken,
		accessToken ? { accessToken } : "skip"
	);

	const reserveItemMutation = useConvexMutation(api.sessions.reserveItem);
	const releaseItemMutation = useConvexMutation(api.sessions.releaseItem);
	const releaseAllReservedByClientMutation = useConvexMutation(
		api.sessions.releaseAllReservedByClient
	);
	const markItemsAsPaidMutation = useConvexMutation(api.sessionPayments.markItemsAsPaid);

	const itemActorsRef = useRef<Map<string, ReturnType<typeof createActor<typeof itemMachine>>>>(new Map());
	const coordinatorActorRef = useRef<ReturnType<typeof createActor<typeof checkoutCoordinatorMachine>> | null>(null);
	// Increment when actors update so items useMemo re-runs and we read fresh snapshots (single source of truth).
	const [actorUpdateTick, setActorUpdateTick] = useState(0);
	const forceUpdate = useCallback(() => setActorUpdateTick((t) => t + 1), []);

	const table = sessionData?.table ?? null;
	const session = sessionData?.session ?? null;
	const rows = sessionData?.items ?? [];

	// Release all reserved items when user leaves the page (close tab / navigate away)
	useEffect(() => {
		if (!accessToken || !clientId) return;

		const handleLeave = () => {
			releaseAllReservedByClientMutation({ accessToken, clientId });
		};

		window.addEventListener("beforeunload", handleLeave);
		window.addEventListener("pagehide", handleLeave);

		return () => {
			window.removeEventListener("beforeunload", handleLeave);
			window.removeEventListener("pagehide", handleLeave);
		};
	}, [accessToken, clientId, releaseAllReservedByClientMutation]);

	// Create or update item actors when session/items change
	useEffect(() => {
		if (!accessToken || !session || !rows.length) {
			return;
		}

		const sessionId = session._id;
		const existing = itemActorsRef.current;
		const seen = new Set<string>();

		for (const row of rows) {
			const id = row._id;
			seen.add(id);
			const existingActor = existing.get(id);
			const reserveItemFn = (sid: string, cId: string) =>
				reserveItemMutation({ sessionItemId: sid as Id<"sessionItems">, clientId: cId }).then(() => {});
			const releaseItemFn = (sid: string, cId: string) =>
				releaseItemMutation({ sessionItemId: sid as Id<"sessionItems">, clientId: cId }).then(() => {});

			if (existingActor) {
				existingActor.send({
					type: "SYNC_FROM_SERVER",
					status: row.status,
					reservedByClientId: row.reservedByClientId,
				});
				continue;
			}

			const actor = createActor(itemMachine, {
				input: {
					sessionItemId: id,
					sessionId,
					name: row.name,
					quantity: row.quantity,
					price: row.price,
					reservedByClientId: row.reservedByClientId,
					clientId,
					reserveItem: reserveItemFn,
					releaseItem: releaseItemFn,
				},
			});
			actor.start();
			actor.subscribe(forceUpdate);
			existing.set(id, actor);
		}

		for (const [id, actor] of existing.entries()) {
			if (!seen.has(id)) {
				actor.stop();
				existing.delete(id);
			}
		}
	}, [accessToken, session, rows, clientId, reserveItemMutation, releaseItemMutation]);

	// Sync Convex → item actors (SYNC_FROM_SERVER) whenever session data changes
	useEffect(() => {
		if (!sessionData?.items?.length || !itemActorsRef.current.size) return;
		const actors = itemActorsRef.current;
		for (const row of sessionData.items) {
			const actor = actors.get(row._id);
			if (actor) {
				actor.send({
					type: "SYNC_FROM_SERVER",
					status: row.status,
					reservedByClientId: row.reservedByClientId,
				});
			}
		}
	}, [sessionData?.items]);

	// Coordinator: create once, send SESSION_LOADED when data loads
	useEffect(() => {
		if (!coordinatorActorRef.current) {
			const coordinator = createActor(checkoutCoordinatorMachine, {
				input: undefined,
			});
			coordinator.start();
			coordinator.subscribe(forceUpdate);
			coordinatorActorRef.current = coordinator;
		}
		const coordinator = coordinatorActorRef.current;
		if (sessionData && accessToken) {
			coordinator.send({
				type: "SESSION_LOADED",
				accessToken,
				clientId,
				session: sessionData.session
					? { _id: sessionData.session._id, totalAmountCents: sessionData.session.totalAmountCents }
					: null,
				items: (sessionData.items ?? []).map((i) => ({
					_id: i._id,
					status: i.status,
					reservedByClientId: i.reservedByClientId,
				})),
			});
		}
	}, [sessionData, accessToken, clientId]);

	// Build items list from rows only (single source of truth). Dedupe by row._id.
	// Re-run when rows or actorUpdateTick change so we read fresh snapshots after reserve/release.
	const items = useMemo(() => {
		const list: Array<{ row: SessionItemRow; snapshot: ItemActorSnapshot }> = [];
		const actors = itemActorsRef.current;
		const seenIds = new Set<string>();
		for (const row of rows) {
			const id = row._id;
			if (seenIds.has(id)) continue;
			seenIds.add(id);
			const actor = actors.get(id);
			if (!actor) continue;
			const snapshot = actor.getSnapshot();
			list.push({
				row: row as SessionItemRow,
				snapshot: {
					value: snapshot.value as ItemStateValue,
					context: snapshot.context,
					matches: (s: ItemStateValue) => snapshot.matches(s),
					can: (e: ItemEvent["type"]) => snapshot.can({ type: e } as ItemEvent),
				},
			});
		}
		// Guarantee one entry per sessionItemId (defensive against any duplicate in rows).
		return list.filter(
			(item, index, arr) =>
				arr.findIndex((x) => x.row._id === item.row._id) === index
		);
	}, [rows, actorUpdateTick]);

	const totalToPayCents = useMemo(() => {
		return items
			.filter((x) => x.snapshot.context.reservedByClientId === clientId)
			.reduce((sum, x) => sum + x.row.price * x.row.quantity, 0);
	}, [items, clientId]);

	const reserve = useCallback(
		(sessionItemId: Id<"sessionItems">) => {
			const actor = itemActorsRef.current.get(sessionItemId);
			if (actor) {
				actor.send({ type: "RESERVE", clientId });
				coordinatorActorRef.current?.send({
					type: "ITEM_RESERVED",
					sessionItemId,
					reservedByClientId: clientId,
				});
			}
		},
		[clientId]
	);

	const release = useCallback(
		(sessionItemId: Id<"sessionItems">) => {
			const actor = itemActorsRef.current.get(sessionItemId);
			if (actor) {
				actor.send({ type: "RELEASE" });
				coordinatorActorRef.current?.send({ type: "ITEM_RELEASED", sessionItemId });
			}
		},
		[]
	);

	const pay = useCallback(
		(opts: {
			createFintocSession: (args: { amount: number; currency: string }) => Promise<{ clientSecret: string; redirectUrl?: string } | null>;
			onSuccess?: () => void;
			onFailure?: (error: string) => void;
		}) => {
			if (!session?._id) {
				opts.onFailure?.("No active session");
				return;
			}
			const reservedByMe = items.filter(
				(x) => x.snapshot.context.reservedByClientId === clientId && x.snapshot.value === "reserved"
			);
			if (reservedByMe.length === 0) {
				opts.onFailure?.("No items reserved");
				return;
			}
			const amountCents = reservedByMe.reduce((s, x) => s + x.row.price * x.row.quantity, 0);
			const coordinator = coordinatorActorRef.current;
			if (coordinator) coordinator.send({ type: "START_PAYMENT" });
			for (const { row } of reservedByMe) {
				const actor = itemActorsRef.current.get(row._id);
				if (actor) actor.send({ type: "START_PAYMENT" });
			}

			opts
				.createFintocSession({ amount: amountCents, currency: "CLP" })
				.then((result) => {
					if (!result?.clientSecret) {
						opts.onFailure?.("Could not create Fintoc session");
						if (coordinator) coordinator.send({ type: "PAYMENT_FAILED" });
						reservedByMe.forEach(({ row }) => {
							const actor = itemActorsRef.current.get(row._id);
							if (actor) actor.send({ type: "PAYMENT_FAILED" });
						});
						return;
					}
					// Caller opens Fintoc widget/redirect with result; when Fintoc confirms,
					// caller should call onSuccess, and we call markItemsAsPaid and send PAYMENT_CONFIRMED
					opts.onSuccess?.();
				})
				.catch((err) => {
					opts.onFailure?.(err?.message ?? "Payment failed");
					if (coordinator) coordinator.send({ type: "PAYMENT_FAILED" });
					reservedByMe.forEach(({ row }) => {
						const actor = itemActorsRef.current.get(row._id);
						if (actor) actor.send({ type: "PAYMENT_FAILED" });
					});
				});
		},
		[session, items, clientId]
	);

	/** Call this after Fintoc confirms payment (e.g. from success redirect or widget callback) */
	const confirmPayment = useCallback(
		(params: { amount: number; currency: string; status: string; fintocPaymentId?: string }) => {
			if (!session?._id) return;
			const reservedByMe = items.filter(
				(x) => x.snapshot.context.reservedByClientId === clientId && (x.snapshot.value === "reserved" || x.snapshot.value === "paying")
			);
			const sessionItemIds = reservedByMe.map((x) => x.row._id);
			markItemsAsPaidMutation({
				sessionId: session._id,
				sessionItemIds,
				amount: params.amount,
				currency: params.currency,
				status: params.status,
				fintocPaymentId: params.fintocPaymentId,
			})
				.then(() => {
					if (coordinatorActorRef.current)
						coordinatorActorRef.current.send({ type: "PAYMENT_CONFIRMED", sessionItemIds });
					reservedByMe.forEach(({ row }) => {
						const actor = itemActorsRef.current.get(row._id);
						if (actor) actor.send({ type: "PAYMENT_CONFIRMED" });
					});
				})
				.catch(() => {
					if (coordinatorActorRef.current) coordinatorActorRef.current.send({ type: "PAYMENT_FAILED" });
					reservedByMe.forEach(({ row }) => {
						const actor = itemActorsRef.current.get(row._id);
						if (actor) actor.send({ type: "PAYMENT_FAILED" });
					});
				});
		},
		[session, items, clientId, markItemsAsPaidMutation]
	);

	const coordinatorSnapshot = coordinatorActorRef.current?.getSnapshot() ?? {
		value: "loading",
		context: { totalToPayCents: 0 },
	};

	return {
		clientId,
		table,
		session,
		items,
		reserve,
		release,
		pay,
		confirmPayment,
		coordinatorSnapshot: {
			value: coordinatorSnapshot.value as string,
			context: { totalToPayCents },
		},
		isLoading: accessToken != null && sessionData === undefined,
	};
}
