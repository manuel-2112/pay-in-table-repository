/**
 * Convex functions for payment coordination
 * Handles persistence and real-time synchronization of payment state
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Payment schema types
 */
export interface PaymentParticipant {
	id: string;
	name: string;
	amount: number;
	status: "pending" | "paid" | "failed";
	paidAt?: number;
}

export interface Payment {
	_id: string;
	_idCreationTime: number;
	paymentId: string;
	amount: number;
	currency: string;
	status: "idle" | "initializing" | "collecting" | "processing" | "completed" | "failed" | "cancelled";
	participants: PaymentParticipant[];
	metadata?: Record<string, unknown>;
	createdAt: number;
	updatedAt: number;
}

/**
 * Create or update a payment
 */
export const upsertPayment = mutation({
	args: {
		paymentId: v.string(),
		amount: v.number(),
		currency: v.string(),
		status: v.string(),
		participants: v.array(
			v.object({
				id: v.string(),
				name: v.string(),
				amount: v.number(),
				status: v.string(),
				paidAt: v.optional(v.number()),
			})
		),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("payments")
			.withIndex("by_payment_id", (q) => q.eq("paymentId", args.paymentId))
			.first();

		const now = Date.now();

		if (existing) {
			await ctx.db.patch(existing._id, {
				amount: args.amount,
				currency: args.currency,
				status: args.status as Payment["status"],
				participants: args.participants as PaymentParticipant[],
				metadata: args.metadata,
				updatedAt: now,
			});
			return existing._id;
		} else {
			return await ctx.db.insert("payments", {
				paymentId: args.paymentId,
				amount: args.amount,
				currency: args.currency,
				status: args.status as Payment["status"],
				participants: args.participants as PaymentParticipant[],
				metadata: args.metadata,
				createdAt: now,
				updatedAt: now,
			});
		}
	},
});

/**
 * Get a payment by paymentId
 */
export const getPayment = query({
	args: {
		paymentId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("payments")
			.withIndex("by_payment_id", (q) => q.eq("paymentId", args.paymentId))
			.first();
	},
});

/**
 * Update participant status
 */
export const updateParticipantStatus = mutation({
	args: {
		paymentId: v.string(),
		participantId: v.string(),
		status: v.string(),
		paidAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const payment = await ctx.db
			.query("payments")
			.withIndex("by_payment_id", (q) => q.eq("paymentId", args.paymentId))
			.first();

		if (!payment) {
			throw new Error(`Payment ${args.paymentId} not found`);
		}

		const updatedParticipants = payment.participants.map((p) =>
			p.id === args.participantId
				? {
						...p,
						status: args.status as PaymentParticipant["status"],
						paidAt: args.paidAt,
					}
				: p
		);

		await ctx.db.patch(payment._id, {
			participants: updatedParticipants,
			updatedAt: Date.now(),
		});

		return payment._id;
	},
});

/**
 * Subscribe to payment changes (real-time)
 * Note: Use useConvexSubscription in React components instead
 */
export const subscribeToPayment = query({
	args: {
		paymentId: v.string(),
	},
	handler: async (ctx, args) => {
		return ctx.db
			.query("payments")
			.withIndex("by_payment_id", (q) => q.eq("paymentId", args.paymentId))
			.first();
	},
});
