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
