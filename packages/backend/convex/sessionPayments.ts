/**
 * Session payments – record payment by token (client), mark items as paid (post Fintoc), auto-close when fully paid.
 */

import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Record a payment for the active session of the table identified by accessToken (client).
 * Validates: token → active session exists → amount <= remaining.
 * Auto-closes session server-side when total paid >= session total.
 */
export const recordPaymentByToken = mutation({
	args: {
		accessToken: v.string(),
		amount: v.number(),
		currency: v.string(),
		status: v.string(),
		fintocPaymentId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const table = await ctx.db
			.query("tables")
			.withIndex("by_access_token", (q) => q.eq("accessToken", args.accessToken))
			.first();

		if (!table) {
			throw new Error("invalid token");
		}

		const activeSession = await ctx.db
			.query("sessions")
			.withIndex("by_table_id_status", (q) =>
				q.eq("tableId", table._id).eq("status", "active")
			)
			.first();

		if (!activeSession) {
			throw new Error("no active session");
		}

		const payments = await ctx.db
			.query("sessionPayments")
			.withIndex("by_session_id", (q) => q.eq("sessionId", activeSession._id))
			.collect();

		const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
		const remaining = activeSession.totalAmountCents - totalPaid;

		if (args.amount > remaining) {
			throw new Error("amount exceeds remaining");
		}

		const now = Date.now();
		await ctx.db.insert("sessionPayments", {
			sessionId: activeSession._id,
			amount: args.amount,
			currency: args.currency,
			status: args.status,
			fintocPaymentId: args.fintocPaymentId,
			createdAt: now,
		});

		const newTotalPaid = totalPaid + args.amount;
		if (newTotalPaid >= activeSession.totalAmountCents) {
			await ctx.db.patch(activeSession._id, {
				status: "closed",
				closedAt: now,
			});
		}

		return activeSession._id;
	},
});

/**
 * Mark specific session items as paid after Fintoc confirmation (client).
 * Validates session is active, all items belong to session and are reserved; then marks them paid,
 * inserts a sessionPayments record, and auto-closes session when total paid >= session total.
 */
export const markItemsAsPaid = mutation({
	args: {
		sessionId: v.id("sessions"),
		sessionItemIds: v.array(v.id("sessionItems")),
		amount: v.number(),
		currency: v.string(),
		status: v.string(),
		fintocPaymentId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const session = await ctx.db.get(args.sessionId);
		if (!session) {
			throw new Error("Session not found");
		}
		if (session.status !== "active") {
			throw new Error("Session is not active");
		}

		for (const itemId of args.sessionItemIds) {
			const item = await ctx.db.get(itemId);
			if (!item) {
				throw new Error("Session item not found");
			}
			if (item.sessionId !== args.sessionId) {
				throw new Error("Item does not belong to this session");
			}
			if (item.status !== "reserved") {
				throw new Error("Item must be reserved to mark as paid");
			}
		}

		const now = Date.now();
		for (const itemId of args.sessionItemIds) {
			await ctx.db.patch(itemId, {
				status: "paid",
				reservedByClientId: undefined,
			});
		}

		await ctx.db.insert("sessionPayments", {
			sessionId: args.sessionId,
			amount: args.amount,
			currency: args.currency,
			status: args.status,
			fintocPaymentId: args.fintocPaymentId,
			createdAt: now,
		});

		const payments = await ctx.db
			.query("sessionPayments")
			.withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
			.collect();
		const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
		if (totalPaid >= session.totalAmountCents) {
			await ctx.db.patch(args.sessionId, {
				status: "closed",
				closedAt: now,
			});
		}

		return args.sessionId;
	},
});
