/**
 * Checkout coordinator machine (table session).
 * Tracks high-level flow: loading → ready → paying → confirming.
 * Item actors are held by the hook; this machine only tracks session state and payment phase.
 */

import { assign, createMachine } from "xstate";
import type {
	CheckoutCoordinatorContext,
	CheckoutCoordinatorEvent,
} from "./types";

export type CoordinatorStateValue =
	| "loading"
	| "ready"
	| "paying"
	| "confirming";

export const checkoutCoordinatorMachine = createMachine({
	types: {} as {
		context: CheckoutCoordinatorContext;
		events: CheckoutCoordinatorEvent;
	},
	id: "checkoutCoordinator",
	initial: "loading",
	context: {
		accessToken: "",
		clientId: "",
		sessionId: undefined,
		session: null,
		itemActors: new Map(),
		totalToPayCents: 0,
	},
	states: {
		loading: {
			on: {
				SESSION_LOADED: {
					target: "ready",
					actions: assign(({ event }) => ({
						accessToken: event.accessToken,
						clientId: event.clientId,
						session: event.session,
						sessionId: event.session?._id,
					})),
				},
			},
		},
		ready: {
			on: {
				ITEM_RESERVED: {
					actions: assign(({ context, event }) => {
						const next = new Map(context.itemActors);
						next.set(event.sessionItemId, {
							sessionItemId: event.sessionItemId,
							reservedByClientId: event.reservedByClientId,
						});
						return { itemActors: next };
					}),
				},
				ITEM_RELEASED: {
					actions: assign(({ context, event }) => {
						const next = new Map(context.itemActors);
						next.delete(event.sessionItemId);
						return { itemActors: next };
					}),
				},
				START_PAYMENT: { target: "paying" },
			},
		},
		paying: {
			on: {
				PAYMENT_CONFIRMED: { target: "confirming" },
				PAYMENT_FAILED: { target: "ready" },
				PAYMENT_CANCELLED: { target: "ready" },
			},
		},
		confirming: {
			on: {
				// After items move to paid, coordinator can go back to ready (or stay for success UI)
				SESSION_LOADED: {
					target: "ready",
					actions: assign(({ event }) => ({
						session: event.session,
						sessionId: event.session?._id,
					})),
				},
			},
		},
	},
});

export type CheckoutCoordinatorMachine = typeof checkoutCoordinatorMachine;
