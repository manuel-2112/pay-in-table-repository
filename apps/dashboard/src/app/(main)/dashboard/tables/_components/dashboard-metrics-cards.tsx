"use client";

import { useQuery } from "convex/react";
import { api } from "@pay-in-table-repository/backend/convex/_generated/api";
import type { Id } from "@pay-in-table-repository/backend/convex/_generated/dataModel";
import { ActiveTablesCard } from "./kpis/active-tables";
import { ItemsPaidTodayCard } from "./kpis/items-paid-today";
import { PaymentsTodayCard } from "./kpis/payments-today";
import { TablesClosedTodayCard } from "./kpis/tables-closed-today";

/**
 * Fetches first restaurant → first location → metrics, then renders the 4 KPI cards.
 * Uses Convex real-time subscription so metrics update live.
 */
export function DashboardMetricsCards() {
	const restaurants = useQuery(api.restaurants.listRestaurants);
	const restaurantId = restaurants?.[0]?._id;

	const locations = useQuery(
		api.restaurants.listLocationsForRestaurant,
		restaurantId == null ? "skip" : { restaurantId },
	);
	const locationId = locations?.[0]?._id as Id<"locations"> | undefined;

	const metrics = useQuery(
		api.tables.getDashboardMetrics,
		locationId == null ? "skip" : { locationId },
	);

	const isLoading =
		restaurants === undefined ||
		locations === undefined ||
		(locationId != null && metrics === undefined);

	return (
		<div className="grid @5xl/main:grid-cols-4 @xl/main:grid-cols-2 grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
			<PaymentsTodayCard
				amountCents={metrics?.paymentsProcessedTodayCents}
				isLoading={isLoading}
			/>
			<TablesClosedTodayCard count={metrics?.tablesClosedToday} isLoading={isLoading} />
			<ActiveTablesCard count={metrics?.activeTablesCount} isLoading={isLoading} />
			<ItemsPaidTodayCard count={metrics?.itemsPaidToday} isLoading={isLoading} />
		</div>
	);
}
