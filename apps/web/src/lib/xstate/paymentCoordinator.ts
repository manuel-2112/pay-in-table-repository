/**
 * Payment Coordinator
 * Manages multiple payment actors and coordinates them in real-time
 */

import { createActor, type ActorRefFrom } from "xstate";
import { paymentMachine } from "./paymentMachine";
import type { PaymentContext, PaymentEvent, PaymentActorRef } from "./types";

export class PaymentCoordinator {
	private actors: Map<string, ActorRefFrom<typeof paymentMachine>> = new Map();

	/**
	 * Create or get a payment actor
	 */
	createPaymentActor(paymentId: string, initialContext?: Partial<PaymentContext>): PaymentActorRef {
		// Check if actor already exists
		if (this.actors.has(paymentId)) {
			const existingActor = this.actors.get(paymentId)!;
			return this.actorToRef(existingActor, paymentId);
		}

		// Create new actor
		// Default context values from the machine definition
		const defaultContext: PaymentContext = {
			paymentId: "",
			amount: 0,
			currency: "USD",
			status: "idle",
			participants: [],
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		const actor = createActor(paymentMachine, {
			input: initialContext
				? {
						...defaultContext,
						...initialContext,
					}
				: undefined,
		});

		actor.start();
		this.actors.set(paymentId, actor);

		return this.actorToRef(actor, paymentId);
	}

	/**
	 * Get an existing payment actor
	 */
	getPaymentActor(paymentId: string): PaymentActorRef | null {
		const actor = this.actors.get(paymentId);
		if (!actor) return null;

		return this.actorToRef(actor, paymentId);
	}

	/**
	 * Remove a payment actor
	 */
	removePaymentActor(paymentId: string): void {
		const actor = this.actors.get(paymentId);
		if (actor) {
			actor.stop();
			this.actors.delete(paymentId);
		}
	}

	/**
	 * Get all active payment actors
	 */
	getAllActors(): PaymentActorRef[] {
		return Array.from(this.actors.entries()).map(([id, actor]) =>
			this.actorToRef(actor, id)
		);
	}

	/**
	 * Convert XState actor to PaymentActorRef interface
	 */
	private actorToRef(
		actor: ActorRefFrom<typeof paymentMachine>,
		paymentId: string
	): PaymentActorRef {
		return {
			id: paymentId,
			send: (event: PaymentEvent) => {
				actor.send(event);
			},
			subscribe: (callback) => {
				const subscription = actor.subscribe((snapshot) => {
					callback({
						value: snapshot.value as PaymentContext["status"],
						context: snapshot.context as PaymentContext,
						matches: (state) => snapshot.matches(state),
						can: (eventType) => snapshot.can({ type: eventType } as PaymentEvent),
					});
				});
				return () => subscription.unsubscribe();
			},
			getSnapshot: () => {
				const snapshot = actor.getSnapshot();
				return {
					value: snapshot.value as PaymentContext["status"],
					context: snapshot.context as PaymentContext,
					matches: (state) => snapshot.matches(state),
					can: (eventType) => snapshot.can({ type: eventType } as PaymentEvent),
				};
			},
			stop: () => {
				actor.stop();
				this.actors.delete(paymentId);
			},
		};
	}

	/**
	 * Cleanup all actors
	 */
	cleanup(): void {
		this.actors.forEach((actor) => actor.stop());
		this.actors.clear();
	}
}

// Singleton instance
export const paymentCoordinator = new PaymentCoordinator();
