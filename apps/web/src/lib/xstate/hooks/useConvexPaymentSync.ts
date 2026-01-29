/**
 * Hook to sync payment actor state with Convex
 */

import { useEffect, useRef } from "react";
import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query";
import { api } from "@2x4/backend/convex/_generated/api";
import type { PaymentActorRef, PaymentContext, PaymentParticipant } from "../types";

interface UseConvexPaymentSyncOptions {
	actor: PaymentActorRef | null;
	paymentId: string | null;
	syncToConvex?: boolean; // Sync actor state to Convex
	syncFromConvex?: boolean; // Sync Convex state to actor
}

/**
 * Hook to synchronize payment actor state with Convex
 * 
 * @param actor - The payment actor to sync
 * @param paymentId - The payment ID
 * @param options - Sync options
 */
export function useConvexPaymentSync({
	actor,
	paymentId,
	syncToConvex = true,
	syncFromConvex = true,
}: UseConvexPaymentSyncOptions) {
	const upsertPayment = useConvexMutation(api.payments.upsertPayment);
	const lastSyncedRef = useRef<string>("");

	// Query Convex payment (automatically subscribes to changes)
	const convexPayment = useConvexQuery(
		api.payments.subscribeToPayment,
		paymentId ? { paymentId } : "skip"
	);

	// Sync actor state to Convex when it changes
	useEffect(() => {
		if (!actor || !paymentId || !syncToConvex) return;

		const unsubscribe = actor.subscribe((snapshot) => {
			const stateString = JSON.stringify({
				status: snapshot.value,
				participants: snapshot.context.participants,
			});

			// Only sync if state actually changed
			if (stateString === lastSyncedRef.current) return;

			lastSyncedRef.current = stateString;

			// Sync to Convex
			upsertPayment({
				paymentId,
				amount: snapshot.context.amount,
				currency: snapshot.context.currency,
				status: snapshot.value,
				participants: snapshot.context.participants.map((p) => ({
					id: p.id,
					name: p.name,
					amount: p.amount,
					status: p.status,
					paidAt: p.paidAt,
				})),
				metadata: snapshot.context.metadata,
			}).catch((error) => {
				console.error("Failed to sync payment to Convex:", error);
			});
		});

		return unsubscribe;
	}, [actor, paymentId, syncToConvex, upsertPayment]);

	// Sync Convex state to actor when it changes
	useEffect(() => {
		if (!actor || !convexPayment || !syncFromConvex) return;

		// Only sync if Convex has newer data
		if (
			convexPayment &&
			convexPayment.updatedAt > actor.getSnapshot().context.updatedAt
		) {
			actor.send({
				type: "SYNC_STATE",
				state: {
					paymentId: convexPayment.paymentId,
					amount: convexPayment.amount,
					currency: convexPayment.currency,
					status: convexPayment.status as PaymentContext["status"],
					participants: convexPayment.participants.map((p: PaymentParticipant) => ({
						id: p.id,
						name: p.name,
						amount: p.amount,
						status: p.status as PaymentParticipant["status"],
						paidAt: p.paidAt,
					})),
					metadata: convexPayment.metadata as Record<string, unknown> | undefined,
					createdAt: convexPayment.createdAt,
					updatedAt: convexPayment.updatedAt,
				},
			});
		}
	}, [actor, convexPayment, syncFromConvex]);

	return {
		convexPayment,
		isSyncing: !!actor && !!paymentId,
	};
}
