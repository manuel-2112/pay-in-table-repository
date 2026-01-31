/**
 * Seed: simula una mesa lista para probar el flujo de pago.
 * - seedDemoTable: crea restaurant → location → mesa → sesión activa → ítems.
 * - seedItemsForTableByToken: añade ítems de prueba a la sesión activa de una mesa existente (por token).
 */

import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const DEMO_ITEMS = [
	{ name: "Cerveza Artesanal", quantity: 2, price: 4500 },
	{ name: "Hamburguesa Clásica", quantity: 1, price: 8900 },
	{ name: "Agua 500ml", quantity: 2, price: 1500 },
];

export const seedDemoTable = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();

		const restaurantId = await ctx.db.insert("restaurants", {
			name: "Demo Restaurant",
			createdAt: now,
		});

		const locationId = await ctx.db.insert("locations", {
			restaurantId,
			name: "Local Principal",
			address: "Av. Demo 123",
			createdAt: now,
		});

		const accessToken = "tk_" + crypto.randomUUID().replace(/-/g, "");
		const tableId = await ctx.db.insert("tables", {
			locationId,
			accessToken,
			label: "Mesa 1",
			createdAt: now,
		});

		const totalAmountCents = DEMO_ITEMS.reduce(
			(sum, i) => sum + i.quantity * i.price,
			0
		);

		const sessionId = await ctx.db.insert("sessions", {
			tableId,
			status: "active",
			totalAmountCents,
			createdAt: now,
		});

		for (const item of DEMO_ITEMS) {
			await ctx.db.insert("sessionItems", {
				sessionId,
				name: item.name,
				quantity: item.quantity,
				price: item.price,
				status: "available",
				createdAt: now,
			});
		}

		return {
			accessToken,
			tableId,
			sessionId,
			totalAmountCents,
			message:
				"Usa el accessToken en la app, ej. http://localhost:3000/pay?token=" + accessToken,
		};
	},
});

/**
 * Añade ítems de prueba a la sesión activa de la mesa identificada por accessToken.
 * Útil cuando ya tienes una mesa/sesión pero sin ítems (ej. creada por dashboard).
 * Actualiza totalAmountCents de la sesión para incluir los nuevos ítems.
 */
export const seedItemsForTableByToken = mutation({
	args: {
		accessToken: v.string(),
	},
	handler: async (ctx, args) => {
		const table = await ctx.db
			.query("tables")
			.withIndex("by_access_token", (q) => q.eq("accessToken", args.accessToken))
			.first();

		if (!table) {
			throw new Error("Mesa no encontrada con ese token");
		}

		const activeSession = await ctx.db
			.query("sessions")
			.withIndex("by_table_id_status", (q) =>
				q.eq("tableId", table._id).eq("status", "active")
			)
			.first();

		if (!activeSession) {
			throw new Error("No hay sesión activa en esta mesa");
		}

		const now = Date.now();
		const itemsTotal = DEMO_ITEMS.reduce(
			(sum, i) => sum + i.quantity * i.price,
			0
		);

		for (const item of DEMO_ITEMS) {
			await ctx.db.insert("sessionItems", {
				sessionId: activeSession._id,
				name: item.name,
				quantity: item.quantity,
				price: item.price,
				status: "available",
				createdAt: now,
			});
		}

		const newTotal = activeSession.totalAmountCents + itemsTotal;
		await ctx.db.patch(activeSession._id, {
			totalAmountCents: newTotal,
		});

		return {
			sessionId: activeSession._id,
			itemsAdded: DEMO_ITEMS.length,
			newTotalAmountCents: newTotal,
		};
	},
});
