/**
 * React hook for using a payment actor
 */

import { useEffect, useState } from "react";
import { usePaymentActor } from "../PaymentActorProvider";
import type { PaymentActorSnapshot } from "../types";

/**
 * Hook to subscribe to a payment actor's state
 */
export function usePaymentActorState(paymentId: string | null) {
	const actor = usePaymentActor(paymentId);
	const [snapshot, setSnapshot] = useState<PaymentActorSnapshot | null>(
		actor ? actor.getSnapshot() : null
	);

	useEffect(() => {
		if (!actor) {
			setSnapshot(null);
			return;
		}

		const unsubscribe = actor.subscribe((state) => {
			setSnapshot(state);
		});

		// Get initial snapshot
		setSnapshot(actor.getSnapshot());

		return unsubscribe;
	}, [actor]);

	return {
		actor,
		state: snapshot,
		send: actor?.send.bind(actor),
	};
}
