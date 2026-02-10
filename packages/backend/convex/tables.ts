/**
 * Tables – create table with accessToken, list tables with sessions (staff).
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

function generateAccessToken(): string {
	const uuid = crypto.randomUUID();
	return "tk_" + uuid.replace(/-/g, "");
}

/**
 * Create a table (mesa) with a permanent accessToken for the QR.
 */
export const createTable = mutation({
	args: {
		locationId: v.id("locations"),
		label: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const location = await ctx.db.get(args.locationId);
		if (!location) {
			throw new Error("Location not found");
		}
		const accessToken = generateAccessToken();
		const now = Date.now();
		return await ctx.db.insert("tables", {
			locationId: args.locationId,
			accessToken,
			label: args.label,
			createdAt: now,
		});
	},
});

/**
 * List all tables for a location with their active session (if any), items, and payments.
 * One subscription for staff dashboard.
 */
export const listTablesWithSessions = query({
	args: {
		locationId: v.id("locations"),
	},
	handler: async (ctx, args) => {
		const tables = await ctx.db
			.query("tables")
			.withIndex("by_location_id", (q) => q.eq("locationId", args.locationId))
			.collect();

		const result: Array<{
			table: Doc<"tables">;
			session: Doc<"sessions"> | null;
			items: Doc<"sessionItems">[];
			payments: Doc<"sessionPayments">[];
		}> = [];

		for (const table of tables) {
			const activeSession = await ctx.db
				.query("sessions")
				.withIndex("by_table_id_status", (q) =>
					q.eq("tableId", table._id).eq("status", "active")
				)
				.first();

			if (!activeSession) {
				result.push({
					table,
					session: null,
					items: [],
					payments: [],
				});
				continue;
			}

			const items = await ctx.db
				.query("sessionItems")
				.withIndex("by_session_id", (q) => q.eq("sessionId", activeSession._id))
				.collect();

			const payments = await ctx.db
				.query("sessionPayments")
				.withIndex("by_session_id", (q) => q.eq("sessionId", activeSession._id))
				.collect();

			result.push({
				table,
				session: activeSession,
				items,
				payments,
			});
		}

		return result;
	},
});

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Dashboard metrics for a location: payments today, tables closed today, active tables, items paid today.
 */
export const getDashboardMetrics = query({
	args: {
		locationId: v.id("locations"),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const since = now - ONE_DAY_MS;

		const tables = await ctx.db
			.query("tables")
			.withIndex("by_location_id", (q) => q.eq("locationId", args.locationId))
			.collect();

		const tableIds = new Set(tables.map((t) => t._id));
		let paymentsProcessedTodayCents = 0;
		let tablesClosedToday = 0;
		const activeTableIds = new Set<string>();
		let itemsPaidToday = 0;

		for (const table of tables) {
			const sessions = await ctx.db
				.query("sessions")
				.withIndex("by_table_id", (q) => q.eq("tableId", table._id))
				.collect();

			for (const session of sessions) {
				if (session.status === "active") {
					activeTableIds.add(table._id);
				}
				if (session.status === "closed" && session.closedAt != null && session.closedAt >= since) {
					tablesClosedToday += 1;
					const items = await ctx.db
						.query("sessionItems")
						.withIndex("by_session_id", (q) => q.eq("sessionId", session._id))
						.collect();
					itemsPaidToday += items.filter((i) => i.status === "paid").length;
				}

				const payments = await ctx.db
					.query("sessionPayments")
					.withIndex("by_session_id", (q) => q.eq("sessionId", session._id))
					.collect();
				for (const p of payments) {
					if (p.createdAt >= since) {
						paymentsProcessedTodayCents += p.amount;
					}
				}
			}
		}

		return {
			paymentsProcessedTodayCents,
			tablesClosedToday,
			activeTablesCount: activeTableIds.size,
			itemsPaidToday,
		};
	},
});
