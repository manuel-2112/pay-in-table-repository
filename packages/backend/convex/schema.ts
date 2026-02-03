import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	// XState/participant flow (existing)
	payments: defineTable({
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
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_payment_id", ["paymentId"]),

	// Cuentas por mesas
	restaurants: defineTable({
		name: v.string(),
		createdAt: v.number(),
	}),

	locations: defineTable({
		restaurantId: v.id("restaurants"),
		name: v.string(),
		address: v.optional(v.string()),
		createdAt: v.number(),
	}).index("by_restaurant_id", ["restaurantId"]),

	tables: defineTable({
		locationId: v.id("locations"),
		accessToken: v.string(),
		label: v.optional(v.string()),
		createdAt: v.number(),
	})
		.index("by_location_id", ["locationId"])
		.index("by_access_token", ["accessToken"]),

	sessions: defineTable({
		tableId: v.id("tables"),
		status: v.union(v.literal("active"), v.literal("closed")),
		totalAmountCents: v.number(),
		createdAt: v.number(),
		closedAt: v.optional(v.number()),
		splitMode: v.optional(
			v.union(
				v.literal("items"),
				v.literal("equal_parts"),
				v.literal("by_amount")
			)
		),
		splitModeChosenAt: v.optional(v.number()),
		splitModeChosenByClientId: v.optional(v.string()),
	})
		.index("by_table_id", ["tableId"])
		.index("by_table_id_status", ["tableId", "status"]),

	sessionItems: defineTable({
		sessionId: v.id("sessions"),
		name: v.string(),
		quantity: v.number(),
		price: v.number(),
		status: v.union(
			v.literal("available"),
			v.literal("reserved"),
			v.literal("paid")
		),
		reservedByClientId: v.optional(v.string()),
		reservedAt: v.optional(v.number()),
		createdAt: v.number(),
	}).index("by_session_id", ["sessionId"]),

	sessionPayments: defineTable({
		sessionId: v.id("sessions"),
		amount: v.number(),
		currency: v.string(),
		status: v.string(),
		fintocPaymentId: v.optional(v.string()),
		createdAt: v.number(),
	}).index("by_session_id", ["sessionId"]),

	sessionEqualParts: defineTable({
		sessionId: v.id("sessions"),
		totalParts: v.number(),
		totalAmountCents: v.number(),
		createdAt: v.number(),
	}).index("by_session_id", ["sessionId"]),

	sessionEqualPartSlots: defineTable({
		sessionEqualPartId: v.id("sessionEqualParts"),
		partIndex: v.number(),
		amountCents: v.number(),
		status: v.union(v.literal("pending"), v.literal("paid")),
		paidAt: v.optional(v.number()),
		fintocPaymentId: v.optional(v.string()),
		clientId: v.optional(v.string()),
	}).index("by_session_equal_part_id", ["sessionEqualPartId"]),

	sessionSplitByAmount: defineTable({
		sessionId: v.id("sessions"),
		totalAmountCents: v.number(),
		createdAt: v.number(),
	}).index("by_session_id", ["sessionId"]),

	sessionSplitByAmountSlots: defineTable({
		sessionSplitByAmountId: v.id("sessionSplitByAmount"),
		amountCents: v.number(),
		status: v.union(v.literal("pending"), v.literal("paid")),
		paidAt: v.optional(v.number()),
		fintocPaymentId: v.optional(v.string()),
		clientId: v.optional(v.string()),
	}).index("by_session_split_by_amount_id", ["sessionSplitByAmountId"]),
});
