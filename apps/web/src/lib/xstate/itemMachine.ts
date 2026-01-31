/**
 * XState machine for a single session item (reserve / release / pay).
 * One instance per session item; coordinates with Convex reserveItem/releaseItem
 * and syncs state from getSessionByToken via SYNC_FROM_SERVER.
 */

import { assign, createMachine, fromPromise } from "xstate";
import type { ItemContext, ItemEvent, ItemInput } from "./types";

export const itemMachine = createMachine(
	{
		types: {} as {
			context: ItemContext;
			events: ItemEvent;
			input: ItemInput;
		},
		id: "item",
		initial: "available",
		context: ({ input }) => ({
			sessionItemId: input.sessionItemId,
			sessionId: input.sessionId,
			name: input.name,
			quantity: input.quantity,
			price: input.price,
			reservedByClientId: input.reservedByClientId,
			clientId: input.clientId,
			reserveItem: input.reserveItem,
			releaseItem: input.releaseItem,
		}),
		states: {
			available: {
				on: {
					RESERVE: {
						target: "reserving",
						actions: assign({
							clientId: ({ event }) => event.clientId,
						}),
					},
					SYNC_FROM_SERVER: {
						actions: assign(({ event }) => {
							if (event.status === "reserved")
								return { reservedByClientId: event.reservedByClientId };
							if (event.status === "paid") return {};
							return { reservedByClientId: undefined };
						}),
					},
				},
			},
			reserving: {
				invoke: {
					src: fromPromise<void>((arg) => {
						const input = arg.input as ItemContext;
						const clientId = input.clientId;
						if (!clientId) return Promise.reject(new Error("No clientId"));
						const reserve = input.reserveItem;
						if (!reserve) return Promise.reject(new Error("reserveItem not provided"));
						return reserve(input.sessionItemId, clientId);
					}),
					input: ({ context }) => context,
					onDone: {
						target: "reserved",
						actions: assign({
							reservedByClientId: ({ context }) => context.clientId ?? undefined,
						}),
					},
					onError: {
						target: "available",
						actions: assign({ reservedByClientId: () => undefined }),
					},
				},
				on: {
					SYNC_FROM_SERVER: [
						{
							target: "available",
							guard: ({ event }) => event.status === "available",
							actions: assign({ reservedByClientId: () => undefined }),
						},
						{
							target: "reserved",
							guard: ({ event }) => event.status === "reserved",
							actions: assign({
								reservedByClientId: ({ event }) => event.reservedByClientId,
							}),
						},
						{
							target: "paid",
							guard: ({ event }) => event.status === "paid",
						},
					],
				},
			},
			reserved: {
				on: {
					RELEASE: {
						target: "releasing",
						guard: ({ context }) =>
							context.reservedByClientId === context.clientId,
					},
					START_PAYMENT: { target: "paying" },
					SYNC_FROM_SERVER: {
						actions: assign(({ event }) => {
							if (event.status === "available")
								return { reservedByClientId: undefined };
							if (event.status === "reserved")
								return { reservedByClientId: event.reservedByClientId };
							return {};
						}),
					},
				},
			},
			releasing: {
				invoke: {
					src: fromPromise<void>((arg) => {
						const input = arg.input as ItemContext;
						const clientId = input.clientId;
						if (!clientId) return Promise.reject(new Error("No clientId"));
						const release = input.releaseItem;
						if (!release) return Promise.reject(new Error("releaseItem not provided"));
						return release(input.sessionItemId, clientId);
					}),
					input: ({ context }) => context,
					onDone: {
						target: "available",
						actions: assign({ reservedByClientId: () => undefined }),
					},
					onError: { target: "reserved" },
				},
				on: {
					SYNC_FROM_SERVER: {
						target: "available",
						guard: ({ event }) => event.status === "available",
						actions: assign({ reservedByClientId: () => undefined }),
					},
				},
			},
			paying: {
				on: {
					PAYMENT_CONFIRMED: { target: "confirming" },
					PAYMENT_FAILED: { target: "reserved" },
					PAYMENT_CANCELLED: { target: "reserved" },
					SYNC_FROM_SERVER: {
						target: "paid",
						guard: ({ event }) => event.status === "paid",
					},
				},
			},
			confirming: {
				after: {
					0: { target: "paid" },
				},
			},
			paid: {
				type: "final",
				on: {
					SYNC_FROM_SERVER: {
						guard: ({ event }) => event.status === "paid",
					},
				},
			},
		},
		on: {
			SYNC_FROM_SERVER: [
				{
					target: ".available",
					guard: ({ event }) => event.status === "available",
					actions: assign({ reservedByClientId: () => undefined }),
				},
				{
					target: ".reserved",
					guard: ({ event }) => event.status === "reserved",
					actions: assign({
						reservedByClientId: ({ event }) => event.reservedByClientId,
					}),
				},
				{
					target: ".paid",
					guard: ({ event }) => event.status === "paid",
				},
			],
		},
	},
	{
		guards: {
			// Used only for reserving transitions; reserving uses explicit SYNC targets
		},
	}
);

export type ItemMachine = typeof itemMachine;
