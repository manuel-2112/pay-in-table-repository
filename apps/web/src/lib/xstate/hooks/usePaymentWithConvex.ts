/**
 * Combined hook for payment actor with Convex synchronization
 */

import { usePaymentActorState } from "./usePaymentActor";
import { useConvexPaymentSync } from "./useConvexPaymentSync";

interface UsePaymentWithConvexOptions {
	paymentId: string | null;
	syncToConvex?: boolean;
	syncFromConvex?: boolean;
}

/**
 * Hook that combines payment actor state with Convex synchronization
 */
export function usePaymentWithConvex({
	paymentId,
	syncToConvex = true,
	syncFromConvex = true,
}: UsePaymentWithConvexOptions) {
	const { actor, state, send } = usePaymentActorState(paymentId);
	const { convexPayment, isSyncing } = useConvexPaymentSync({
		actor,
		paymentId,
		syncToConvex,
		syncFromConvex,
	});

	return {
		actor,
		state,
		send,
		convexPayment,
		isSyncing,
	};
}
