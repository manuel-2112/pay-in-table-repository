/**
 * Restaurants and locations – setup for cuentas por mesas.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

/**
 * List locations for a restaurant (for dashboard location selector).
 */
export const listLocationsForRestaurant = query({
	args: {
		restaurantId: v.id("restaurants"),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("locations")
			.withIndex("by_restaurant_id", (q) => q.eq("restaurantId", args.restaurantId))
			.collect();
	},
});

/**
 * List all restaurants (for dashboard; first restaurant's first location can be used as default).
 */
export const listRestaurants = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("restaurants").collect();
	},
});
