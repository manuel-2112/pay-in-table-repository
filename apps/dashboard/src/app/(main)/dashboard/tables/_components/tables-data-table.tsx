"use client";

import { useQuery } from "convex/react";
import { api } from "@pay-in-table-repository/backend/convex/_generated/api";
import type { Id } from "@pay-in-table-repository/backend/convex/_generated/dataModel";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mapTablesWithSessionsToRows, type TableWithSessionEntry } from "../_lib";
import { tablesColumns } from "./columns-tables";

/**
 * Real-time table list for a location. Uses first restaurant → first location.
 * Subscribes to listTablesWithSessions so the table updates live.
 * Mismo diseño que TableCards (CRM): Card con header, tabla dentro de CardContent.
 */
export function TablesDataTable() {
	const restaurants = useQuery(api.restaurants.listRestaurants);
	const restaurantId = restaurants?.[0]?._id;

	const locations = useQuery(
		api.restaurants.listLocationsForRestaurant,
		restaurantId == null ? "skip" : { restaurantId },
	);
	const locationId = locations?.[0]?._id as Id<"locations"> | undefined;

	const tablesWithSessions = useQuery(
		api.tables.listTablesWithSessions,
		locationId == null ? "skip" : { locationId },
	);

	let data: ReturnType<typeof mapTablesWithSessionsToRows> = [];
	if (tablesWithSessions) {
		try {
			data = mapTablesWithSessionsToRows(tablesWithSessions as TableWithSessionEntry[]);
		} catch (err) {
			console.error("[TablesDataTable] Error al mapear mesas:", err);
		}
	}

	const table = useDataTableInstance({
		data,
		columns: tablesColumns,
		enableRowSelection: false,
		getRowId: (row) => row.tableId,
		defaultPageSize: 10,
	});

	// Verificar que columnas y datos coinciden (headers vs accessorKeys)
	const columnKeys = tablesColumns.map((col) => (col as { id?: string; accessorKey?: string }).id ?? (col as { accessorKey?: string }).accessorKey);
	console.log("[TablesDataTable] columnas (id/accessorKey):", columnKeys);
	console.log("[TablesDataTable] datos (primera fila keys):", data[0] ? Object.keys(data[0]) : []);
	console.log("[TablesDataTable] datos (primera fila):", data[0] ?? null);

	if (locationId == null && locations !== undefined) {
		return (
			<div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
				No hay ubicaciones. Crea un restaurante y una ubicación para ver las mesas.
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs">
			<Card>
				<CardHeader>
					<CardTitle>Estado de mesas</CardTitle>
					<CardDescription>Mesas de la ubicación y estado de cada sesión en tiempo real.</CardDescription>
					<CardAction>
						<DataTableViewOptions table={table} />
					</CardAction>
				</CardHeader>
				<CardContent className="flex size-full flex-col gap-4">
					<div className="overflow-hidden rounded-md border">
						<DataTable table={table} columns={tablesColumns} compactFirstColumn={false} />
					</div>
					<DataTablePagination table={table} />
				</CardContent>
			</Card>
		</div>
	);
}
