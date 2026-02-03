/**
 * Sessions – get session by token (client), open/close session, add items (staff).
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get session, items, and payments by table accessToken (client).
 * Single subscription for the pay flow.
 */
export const getSessionByToken = query({
	args: {
		accessToken: v.string(),
	},
	handler: async (ctx, args) => {
		const table = await ctx.db
			.query("tables")
			.withIndex("by_access_token", (q) => q.eq("accessToken", args.accessToken))
			.first();

		if (!table) {
			return { table: null, session: null, items: [], payments: [] };
		}

		const activeSession = await ctx.db
			.query("sessions")
			.withIndex("by_table_id_status", (q) =>
				q.eq("tableId", table._id).eq("status", "active")
			)
			.first();

		if (!activeSession) {
			return {
				table,
				session: null,
				items: [],
				payments: [],
			};
		}

		const items = await ctx.db
			.query("sessionItems")
			.withIndex("by_session_id", (q) => q.eq("sessionId", activeSession._id))
			.collect();

		const payments = await ctx.db
			.query("sessionPayments")
			.withIndex("by_session_id", (q) => q.eq("sessionId", activeSession._id))
			.collect();

		return {
			table,
			session: activeSession,
			items,
			payments,
		};
	},
});

/**
 * Choose split mode for the session (client). First caller sets the mode; others get current mode.
 * Returns the current splitMode (so client can enable/disable buttons).
 */
export const chooseSplitMode = mutation({
	args: {
		accessToken: v.string(),
		clientId: v.string(),
		mode: v.union(
			v.literal("items"),
			v.literal("equal_parts"),
			v.literal("by_amount")
		),
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

		const currentMode = activeSession.splitMode;
		if (currentMode != null) {
			return currentMode;
		}

		const now = Date.now();
		await ctx.db.patch(activeSession._id, {
			splitMode: args.mode,
			splitModeChosenAt: now,
			splitModeChosenByClientId: args.clientId,
		});
		return args.mode;
	},
});

/**
 * Clear split mode (only the client who chose it can clear). Sets splitMode back to null.
 */
export const clearSplitMode = mutation({
	args: {
		accessToken: v.string(),
		clientId: v.string(),
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

		const chosenBy = activeSession.splitModeChosenByClientId;
		if (activeSession.splitMode == null) {
			return; // already clear, idempotent
		}
		if (chosenBy !== args.clientId) {
			throw new Error("solo quien eligió el método puede deshacerlo");
		}

		await ctx.db.patch(activeSession._id, {
			splitMode: undefined,
			splitModeChosenAt: undefined,
			splitModeChosenByClientId: undefined,
		});
	},
});

/**
 * Open a new session on a table (staff).
 * Fails if the table already has an active session.
 */
export const openSession = mutation({
	args: {
		tableId: v.id("tables"),
		totalAmountCents: v.number(),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("sessions")
			.withIndex("by_table_id_status", (q) =>
				q.eq("tableId", args.tableId).eq("status", "active")
			)
			.first();

		if (existing) {
			throw new Error("Table already has an active session");
		}

		const now = Date.now();
		return await ctx.db.insert("sessions", {
			tableId: args.tableId,
			status: "active",
			totalAmountCents: args.totalAmountCents,
			createdAt: now,
		});
	},
});

/**
 * Add a line item to an active session (staff).
 */
export const addSessionItem = mutation({
	args: {
		sessionId: v.id("sessions"),
		name: v.string(),
		quantity: v.number(),
		price: v.number(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.db.get(args.sessionId);
		if (!session) {
			throw new Error("Session not found");
		}
		if (session.status !== "active") {
			throw new Error("Session is not active");
		}

		const now = Date.now();
		return await ctx.db.insert("sessionItems", {
			sessionId: args.sessionId,
			name: args.name,
			quantity: args.quantity,
			price: args.price,
			status: "available",
			createdAt: now,
		});
	},
});

/**
 * Reserve a session item for a client (client).
 * Fails if item is not available or session is not active.
 */
export const reserveItem = mutation({
	args: {
		sessionItemId: v.id("sessionItems"),
		clientId: v.string(),
	},
	handler: async (ctx, args) => {
		const item = await ctx.db.get(args.sessionItemId);
		if (!item) {
			throw new Error("Item not found");
		}

		const session = await ctx.db.get(item.sessionId);
		if (!session || session.status !== "active") {
			throw new Error("Session is not active");
		}

		if (item.status !== "available") {
			throw new Error("Item is not available (already reserved or paid)");
		}

		await ctx.db.patch(args.sessionItemId, {
			status: "reserved",
			reservedByClientId: args.clientId,
			reservedAt: Date.now(),
		});
		return args.sessionItemId;
	},
});

/**
 * Release a reserved session item (client).
 * Only the client who reserved it can release.
 */
export const releaseItem = mutation({
	args: {
		sessionItemId: v.id("sessionItems"),
		clientId: v.string(),
	},
	handler: async (ctx, args) => {
		const item = await ctx.db.get(args.sessionItemId);
		if (!item) {
			throw new Error("Item not found");
		}

		const session = await ctx.db.get(item.sessionId);
		if (!session || session.status !== "active") {
			throw new Error("Session is not active");
		}

		if (item.status !== "reserved" || item.reservedByClientId !== args.clientId) {
			throw new Error("Only the client who reserved this item can release it");
		}

		await ctx.db.patch(args.sessionItemId, {
			status: "available",
			reservedByClientId: undefined,
			reservedAt: undefined,
		});
		return args.sessionItemId;
	},
});

/**
 * Release all items reserved by a client in the session for the given table token (e.g. on page leave).
 * Idempotent: no-op if table/session not found or no reserved items.
 */
export const releaseAllReservedByClient = mutation({
	args: {
		accessToken: v.string(),
		clientId: v.string(),
	},
	handler: async (ctx, args) => {
		const table = await ctx.db
			.query("tables")
			.withIndex("by_access_token", (q) => q.eq("accessToken", args.accessToken))
			.first();

		if (!table) return;

		const activeSession = await ctx.db
			.query("sessions")
			.withIndex("by_table_id_status", (q) =>
				q.eq("tableId", table._id).eq("status", "active")
			)
			.first();

		if (!activeSession) return;

		const items = await ctx.db
			.query("sessionItems")
			.withIndex("by_session_id", (q) => q.eq("sessionId", activeSession._id))
			.collect();

		const toRelease = items.filter(
			(i) => i.status === "reserved" && i.reservedByClientId === args.clientId
		);

		for (const item of toRelease) {
			await ctx.db.patch(item._id, {
				status: "available",
				reservedByClientId: undefined,
				reservedAt: undefined,
			});
		}
	},
});

/** Max time a reservation is held before auto-release (5 minutes). */
const RESERVATION_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Release reserved items that have been held longer than RESERVATION_TIMEOUT_MS.
 * Intended to be run by a cron job every 2–5 minutes.
 */
export const releaseStaleReservations = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const cutoff = now - RESERVATION_TIMEOUT_MS;

		const activeSessions = await ctx.db
			.query("sessions")
			.filter((q) => q.eq(q.field("status"), "active"))
			.collect();

		for (const session of activeSessions) {
			const items = await ctx.db
				.query("sessionItems")
				.withIndex("by_session_id", (q) => q.eq("sessionId", session._id))
				.collect();

			const stale = items.filter(
				(i) =>
					i.status === "reserved" &&
					i.reservedAt != null &&
					i.reservedAt < cutoff
			);

			for (const item of stale) {
				await ctx.db.patch(item._id, {
					status: "available",
					reservedByClientId: undefined,
					reservedAt: undefined,
				});
			}
		}
	},
});

/**
 * Close a session manually (staff).
 */
export const closeSession = mutation({
	args: {
		sessionId: v.id("sessions"),
	},
	handler: async (ctx, args) => {
		const session = await ctx.db.get(args.sessionId);
		if (!session) {
			throw new Error("Session not found");
		}
		if (session.status !== "active") {
			throw new Error("Session is not active");
		}

		const now = Date.now();
		await ctx.db.patch(args.sessionId, {
			status: "closed",
			closedAt: now,
		});
		return args.sessionId;
	},
});
