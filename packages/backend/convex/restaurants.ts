/**
 * Restaurants and locations – setup for cuentas por mesas.
 */

import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Create a restaurant.
 */
export const createRestaurant = mutation({
	args: {
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		return await ctx.db.insert("restaurants", {
			name: args.name,
			createdAt: now,
		});
	},
});

/**
 * Create a location (sucursal) for a restaurant.
 */
export const createLocation = mutation({
	args: {
		restaurantId: v.id("restaurants"),
		name: v.string(),
		address: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		return await ctx.db.insert("locations", {
			restaurantId: args.restaurantId,
			name: args.name,
			address: args.address,
			createdAt: now,
		});
	},
});
