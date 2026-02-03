/**
 * Session split by amount – create split, add slots (amounts), pay a slot.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

async function getTableAndSession(ctx: { db: any }, accessToken: string) {
	const table = await ctx.db
		.query("tables")
		.withIndex("by_access_token", (q: any) => q.eq("accessToken", accessToken))
		.first();
	if (!table) return null;
	const activeSession = await ctx.db
		.query("sessions")
		.withIndex("by_table_id_status", (q: any) =>
			q.eq("tableId", table._id).eq("status", "active")
		)
		.first();
	if (!activeSession) return null;
	return { table, session: activeSession };
}

/**
 * Create split-by-amount config for the active session. Idempotent: no-op if already exists.
 */
export const createSplitByAmount = mutation({
	args: {
		accessToken: v.string(),
	},
	handler: async (ctx, args) => {
		const result = await getTableAndSession(ctx, args.accessToken);
		if (!result) {
			throw new Error("invalid token or no active session");
		}
		const { session } = result;
		if (session.splitMode !== "by_amount") {
			throw new Error("session split mode is not by_amount");
		}

		const existing = await ctx.db
			.query("sessionSplitByAmount")
			.withIndex("by_session_id", (q) => q.eq("sessionId", session._id))
			.first();
		if (existing) {
			return existing._id;
		}

		const now = Date.now();
		return await ctx.db.insert("sessionSplitByAmount", {
			sessionId: session._id,
			totalAmountCents: session.totalAmountCents,
			createdAt: now,
		});
	},
});

/**
 * Get split-by-amount config and slots by accessToken.
 */
export const getSplitByAmountByToken = query({
	args: {
		accessToken: v.string(),
	},
	handler: async (ctx, args) => {
		const result = await getTableAndSession(ctx, args.accessToken);
		if (!result) return null;
		const { session } = result;
		if (session.splitMode !== "by_amount") return null;

		const config = await ctx.db
			.query("sessionSplitByAmount")
			.withIndex("by_session_id", (q) => q.eq("sessionId", session._id))
			.first();
		if (!config) return { config: null, slots: [] };

		const slots = await ctx.db
			.query("sessionSplitByAmountSlots")
			.withIndex("by_session_split_by_amount_id", (q) =>
				q.eq("sessionSplitByAmountId", config._id)
			)
			.collect();
		return { config, slots };
	},
});

/**
 * Add a slot (amount to pay) for split by amount. Validates sum of slots does not exceed total.
 */
export const addAmountSlot = mutation({
	args: {
		accessToken: v.string(),
		amountCents: v.number(),
	},
	handler: async (ctx, args) => {
		const result = await getTableAndSession(ctx, args.accessToken);
		if (!result) {
			throw new Error("invalid token or no active session");
		}
		const { session } = result;
		if (session.splitMode !== "by_amount") {
			throw new Error("session split mode is not by_amount");
		}
		if (args.amountCents <= 0) {
			throw new Error("amountCents must be positive");
		}

		let config = await ctx.db
			.query("sessionSplitByAmount")
			.withIndex("by_session_id", (q) => q.eq("sessionId", session._id))
			.first();
		if (!config) {
			const now = Date.now();
			const configId = await ctx.db.insert("sessionSplitByAmount", {
				sessionId: session._id,
				totalAmountCents: session.totalAmountCents,
				createdAt: now,
			});
			const inserted = await ctx.db.get(configId);
			if (!inserted) throw new Error("failed to create config");
			config = inserted;
		}

		const slots = await ctx.db
			.query("sessionSplitByAmountSlots")
			.withIndex("by_session_split_by_amount_id", (q) =>
				q.eq("sessionSplitByAmountId", config!._id)
			)
			.collect();
		const currentSum = slots.reduce((s, slot) => s + slot.amountCents, 0);
		if (currentSum + args.amountCents > config.totalAmountCents) {
			throw new Error("total slots would exceed session total");
		}

		return await ctx.db.insert("sessionSplitByAmountSlots", {
			sessionSplitByAmountId: config._id,
			amountCents: args.amountCents,
			status: "pending",
		});
	},
});

/**
 * Mark one amount slot as paid (after Fintoc). Closes session when sum paid >= total.
 */
export const payAmountSlot = mutation({
	args: {
		accessToken: v.string(),
		sessionSplitByAmountSlotId: v.id("sessionSplitByAmountSlots"),
		amount: v.number(),
		currency: v.string(),
		status: v.string(),
		fintocPaymentId: v.optional(v.string()),
		clientId: v.string(),
	},
	handler: async (ctx, args) => {
		const result = await getTableAndSession(ctx, args.accessToken);
		if (!result) {
			throw new Error("invalid token or no active session");
		}
		const { session } = result;

		const slot = await ctx.db.get(args.sessionSplitByAmountSlotId);
		if (!slot) {
			throw new Error("slot not found");
		}
		const config = await ctx.db.get(slot.sessionSplitByAmountId);
		if (!config || config.sessionId !== session._id) {
			throw new Error("slot does not belong to this session");
		}
		if (slot.status !== "pending") {
			throw new Error("slot is already paid");
		}

		const now = Date.now();
		await ctx.db.patch(args.sessionSplitByAmountSlotId, {
			status: "paid",
			paidAt: now,
			fintocPaymentId: args.fintocPaymentId,
			clientId: args.clientId,
		});

		await ctx.db.insert("sessionPayments", {
			sessionId: session._id,
			amount: args.amount,
			currency: args.currency,
			status: args.status,
			fintocPaymentId: args.fintocPaymentId,
			createdAt: now,
		});

		const allSlots = await ctx.db
			.query("sessionSplitByAmountSlots")
			.withIndex("by_session_split_by_amount_id", (q) =>
				q.eq("sessionSplitByAmountId", config._id)
			)
			.collect();
		const totalPaid = allSlots
			.filter((s) => s.status === "paid")
			.reduce((sum, s) => sum + s.amountCents, 0);
		if (totalPaid >= config.totalAmountCents) {
			await ctx.db.patch(session._id, {
				status: "closed",
				closedAt: now,
			});
		}

		return config.sessionId;
	},
});
