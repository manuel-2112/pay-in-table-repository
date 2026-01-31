/**
 * XState machine for coordinating payment actors
 */

import { createMachine, assign, fromPromise } from "xstate";
import type { PaymentContext, PaymentEvent, PaymentStatus } from "./types";

/**
 * Payment coordination machine
 * Coordinates multiple payment participants in real-time
 */
export const paymentMachine = createMachine(
	{
		types: {} as {
			context: PaymentContext;
			events: PaymentEvent;
		},
		id: "payment",
		initial: "idle",
		context: {
			paymentId: "",
			amount: 0,
			currency: "USD",
			status: "idle",
			participants: [],
			createdAt: Date.now(),
			updatedAt: Date.now(),
		},
		states: {
			idle: {
				on: {
					INITIALIZE: {
						target: "initializing",
						actions: assign({
							paymentId: ({ event }) => event.paymentId,
							amount: ({ event }) => event.amount,
							currency: ({ event }) => event.currency,
							participants: ({ event }) => event.participants,
							status: () => "initializing" as PaymentStatus,
							createdAt: () => Date.now(),
							updatedAt: () => Date.now(),
						}),
					},
				},
			},
			initializing: {
				after: {
					// Small delay to ensure all participants are ready
					100: {
						target: "collecting",
						actions: assign({
							status: () => "collecting" as PaymentStatus,
							updatedAt: () => Date.now(),
						}),
					},
				},
			},
			collecting: {
				on: {
					PARTICIPANT_PAID: {
						actions: assign({
							participants: ({ context, event }) =>
								context.participants.map((p) =>
									p.id === event.participantId
										? {
												...p,
												status: "paid" as const,
												paidAt: Date.now(),
											}
										: p
								),
							updatedAt: () => Date.now(),
						}),
					},
					PARTICIPANT_FAILED: {
						actions: assign({
							participants: ({ context, event }) =>
								context.participants.map((p) =>
									p.id === event.participantId
										? {
												...p,
												status: "failed" as const,
											}
										: p
								),
							updatedAt: () => Date.now(),
						}),
					},
					PROCESS_PAYMENT: {
						guard: ({ context }) => {
							// Check if all participants have paid
							const allPaid = context.participants.every(
								(p) => p.status === "paid"
							);
							return allPaid;
						},
						target: "processing",
						actions: assign({
							status: () => "processing" as PaymentStatus,
							updatedAt: () => Date.now(),
						}),
					},
					CANCEL_PAYMENT: {
						target: "cancelled",
						actions: assign({
							status: () => "cancelled" as PaymentStatus,
							updatedAt: () => Date.now(),
						}),
					},
				},
			},
			processing: {
				invoke: {
					src: fromPromise(async () => {
						// Simulate payment processing
						// In real implementation, this would call Convex mutation
						await new Promise((resolve) => setTimeout(resolve, 1000));
						return { success: true };
					}),
					input: ({ context }) => context,
					onDone: {
						target: "completed",
						actions: assign({
							status: () => "completed" as PaymentStatus,
							updatedAt: () => Date.now(),
						}),
					},
					onError: {
						target: "failed",
						actions: assign({
							status: () => "failed" as PaymentStatus,
							updatedAt: () => Date.now(),
						}),
					},
				},
			},
			completed: {
				type: "final",
			},
			failed: {
				on: {
					INITIALIZE: {
						target: "initializing",
						actions: assign({
							paymentId: ({ event }) => event.paymentId,
							amount: ({ event }) => event.amount,
							currency: ({ event }) => event.currency,
							participants: ({ event }) => event.participants,
							status: () => "initializing" as PaymentStatus,
							updatedAt: () => Date.now(),
						}),
					},
				},
			},
			cancelled: {
				type: "final",
			},
		},
		on: {
			SYNC_STATE: {
				actions: assign(({ event }) => ({
					...event.state,
					updatedAt: Date.now(),
				})),
			},
		},
	},
	{
		guards: {
			allParticipantsPaid: ({ context }) => {
				return context.participants.every((p) => p.status === "paid");
			},
		},
	}
);
