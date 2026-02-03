/**
 * Session equal parts – create split by N equal parts, get slots, pay a slot.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get table and active session by accessToken.
 */
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
 * Create equal-parts split for the active session. Idempotent: no-op if already exists.
 */
export const createEqualPartsSplit = mutation({
	args: {
		accessToken: v.string(),
		clientId: v.string(),
		totalParts: v.number(),
	},
	handler: async (ctx, args) => {
		const result = await getTableAndSession(ctx, args.accessToken);
		if (!result) {
			throw new Error("invalid token or no active session");
		}
		const { session } = result;
		if (session.splitMode !== "equal_parts") {
			throw new Error("session split mode is not equal_parts");
		}
		if (args.totalParts < 1 || args.totalParts > 100) {
			throw new Error("totalParts must be between 1 and 100");
		}

		const existing = await ctx.db
			.query("sessionEqualParts")
			.withIndex("by_session_id", (q) => q.eq("sessionId", session._id))
			.first();
		if (existing) {
			return existing._id;
		}

		const now = Date.now();
		const totalAmountCents = session.totalAmountCents;
		const baseAmount = Math.floor(totalAmountCents / args.totalParts);
		const remainder = totalAmountCents - baseAmount * args.totalParts;

		const equalPartsId = await ctx.db.insert("sessionEqualParts", {
			sessionId: session._id,
			totalParts: args.totalParts,
			totalAmountCents,
			createdAt: now,
		});

		for (let i = 1; i <= args.totalParts; i++) {
			const amountCents = baseAmount + (i <= remainder ? 1 : 0);
			await ctx.db.insert("sessionEqualPartSlots", {
				sessionEqualPartId: equalPartsId,
				partIndex: i,
				amountCents,
				status: "pending",
			});
		}

		return equalPartsId;
	},
});

/**
 * Get equal-parts config and slots by accessToken.
 */
export const getEqualPartsByToken = query({
	args: {
		accessToken: v.string(),
	},
	handler: async (ctx, args) => {
		const result = await getTableAndSession(ctx, args.accessToken);
		if (!result) return null;
		const { session } = result;
		if (session.splitMode !== "equal_parts") return null;

		const config = await ctx.db
			.query("sessionEqualParts")
			.withIndex("by_session_id", (q) => q.eq("sessionId", session._id))
			.first();
		if (!config) return { config: null, slots: [] };

		const slots = await ctx.db
			.query("sessionEqualPartSlots")
			.withIndex("by_session_equal_part_id", (q) =>
				q.eq("sessionEqualPartId", config._id)
			)
			.collect();
		slots.sort((a, b) => a.partIndex - b.partIndex);
		return { config, slots };
	},
});

/**
 * Mark one equal-part slot as paid (after Fintoc). Closes session when all slots paid.
 */
export const payEqualPartSlot = mutation({
	args: {
		accessToken: v.string(),
		sessionEqualPartSlotId: v.id("sessionEqualPartSlots"),
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

		const slot = await ctx.db.get(args.sessionEqualPartSlotId);
		if (!slot) {
			throw new Error("slot not found");
		}
		const config = await ctx.db.get(slot.sessionEqualPartId);
		if (!config || config.sessionId !== session._id) {
			throw new Error("slot does not belong to this session");
		}
		if (slot.status !== "pending") {
			throw new Error("slot is already paid");
		}

		const now = Date.now();
		await ctx.db.patch(args.sessionEqualPartSlotId, {
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
			.query("sessionEqualPartSlots")
			.withIndex("by_session_equal_part_id", (q) =>
				q.eq("sessionEqualPartId", config._id)
			)
			.collect();
		const allPaid = allSlots.every((s) => s._id === slot._id || s.status === "paid");
		if (allPaid) {
			await ctx.db.patch(session._id, {
				status: "closed",
				closedAt: now,
			});
		}

		return config.sessionId;
	},
});

/**
 * Mark the first N pending equal-part slots as paid (one Fintoc payment for multiple parts).
 */
export const payEqualPartSlotsByCount = mutation({
	args: {
		accessToken: v.string(),
		partsToPay: v.number(),
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
		if (args.partsToPay < 1) {
			throw new Error("partsToPay must be at least 1");
		}

		const config = await ctx.db
			.query("sessionEqualParts")
			.withIndex("by_session_id", (q) => q.eq("sessionId", session._id))
			.first();
		if (!config) {
			throw new Error("equal parts split not found");
		}

		const slots = await ctx.db
			.query("sessionEqualPartSlots")
			.withIndex("by_session_equal_part_id", (q) =>
				q.eq("sessionEqualPartId", config._id)
			)
			.collect();
		slots.sort((a, b) => a.partIndex - b.partIndex);
		const pending = slots.filter((s) => s.status === "pending");
		const toPay = pending.slice(0, args.partsToPay);
		if (toPay.length < args.partsToPay) {
			throw new Error("not enough pending slots");
		}

		const now = Date.now();
		for (const slot of toPay) {
			await ctx.db.patch(slot._id, {
				status: "paid",
				paidAt: now,
				fintocPaymentId: args.fintocPaymentId,
				clientId: args.clientId,
			});
		}

		await ctx.db.insert("sessionPayments", {
			sessionId: session._id,
			amount: args.amount,
			currency: args.currency,
			status: args.status,
			fintocPaymentId: args.fintocPaymentId,
			createdAt: now,
		});

		const allSlots = await ctx.db
			.query("sessionEqualPartSlots")
			.withIndex("by_session_equal_part_id", (q) =>
				q.eq("sessionEqualPartId", config._id)
			)
			.collect();
		const allPaid = allSlots.every((s) => s.status === "paid");
		if (allPaid) {
			await ctx.db.patch(session._id, {
				status: "closed",
				closedAt: now,
			});
		}
		return config.sessionId;
	},
});
