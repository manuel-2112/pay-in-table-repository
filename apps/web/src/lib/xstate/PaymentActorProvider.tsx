/**
 * React Provider for Payment Actors
 * Provides access to payment coordinator and actors throughout the app
 */

import React, { createContext, useContext, useEffect, useRef } from "react";
import { PaymentCoordinator, paymentCoordinator } from "./paymentCoordinator";
import type { PaymentActorRef } from "./types";

interface PaymentActorContextValue {
	coordinator: PaymentCoordinator;
	getPaymentActor: (paymentId: string) => PaymentActorRef | null;
	createPaymentActor: (
		paymentId: string,
		initialContext?: Partial<import("./types").PaymentContext>
	) => PaymentActorRef;
	removePaymentActor: (paymentId: string) => void;
}

const PaymentActorContext = createContext<PaymentActorContextValue | null>(null);

interface PaymentActorProviderProps {
	children: React.ReactNode;
	coordinator?: PaymentCoordinator;
}

export function PaymentActorProvider({
	children,
	coordinator = paymentCoordinator,
}: PaymentActorProviderProps) {
	const cleanupRef = useRef(false);

	useEffect(() => {
		return () => {
			// Cleanup on unmount
			if (!cleanupRef.current) {
				cleanupRef.current = true;
				coordinator.cleanup();
			}
		};
	}, [coordinator]);

	const value: PaymentActorContextValue = {
		coordinator,
		getPaymentActor: (paymentId: string) => coordinator.getPaymentActor(paymentId),
		createPaymentActor: (paymentId: string, initialContext?) =>
			coordinator.createPaymentActor(paymentId, initialContext),
		removePaymentActor: (paymentId: string) => coordinator.removePaymentActor(paymentId),
	};

	return (
		<PaymentActorContext.Provider value={value}>
			{children}
		</PaymentActorContext.Provider>
	);
}

/**
 * Hook to access payment actor context
 */
export function usePaymentActorContext(): PaymentActorContextValue {
	const context = useContext(PaymentActorContext);
	if (!context) {
		throw new Error(
			"usePaymentActorContext must be used within a PaymentActorProvider"
		);
	}
	return context;
}

/**
 * Hook to get or create a payment actor
 */
export function usePaymentActor(paymentId: string | null) {
	const { getPaymentActor, createPaymentActor } = usePaymentActorContext();

	if (!paymentId) {
		return null;
	}

	const actor = getPaymentActor(paymentId) || createPaymentActor(paymentId);

	return actor;
}
