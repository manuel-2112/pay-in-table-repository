import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
	})
		.index("by_payment_id", ["paymentId"]),
});
