"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CreditCard, CircleDot, UtensilsCrossed } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

import type { TableRow, TableStatus } from "../_lib";
import { TABLE_STATUS_LABELS } from "../_lib";

function StatusBadge({ status }: { status: TableStatus }) {
	const config = {
		libre: {
			variant: "outline" as const,
			className: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400",
			icon: CircleDot,
		},
		atendido: {
			variant: "outline" as const,
			className: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
			icon: UtensilsCrossed,
		},
		en_proceso_de_pago: {
			variant: "outline" as const,
			className: "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400",
			icon: CreditCard,
		},
	}[status];
	const Icon = config.icon;
	return (
		<Badge variant={config.variant} className={config.className}>
			<Icon className="size-3.5" />
			{TABLE_STATUS_LABELS[status]}
		</Badge>
	);
}

export const tablesColumns: ColumnDef<TableRow>[] = [
	{
		id: "mesa",
		accessorKey: "label",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Mesa" />,
		cell: ({ row }) => <span className="font-medium">{row.original.label}</span>,
		enableSorting: true,
	},
	{
		id: "estado",
		accessorKey: "status",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
		cell: ({ row }) => <StatusBadge status={row.original.status} />,
		enableSorting: true,
		filterFn: (row, _id, value: TableStatus[]) =>
			value.length === 0 || value.includes(row.getValue(_id)),
	},
	{
		id: "total",
		accessorKey: "totalAmountCents",
		header: ({ column }) => (
			<DataTableColumnHeader className="w-full text-right" column={column} title="Total" />
		),
		cell: ({ row }) => {
			const cents = row.original.totalAmountCents;
			if (cents == null) return <span className="text-muted-foreground">—</span>;
			return (
				<div className="text-right tabular-nums">
					${(cents / 100).toLocaleString("es-CL", { maximumFractionDigits: 0 })}
				</div>
			);
		},
		enableSorting: true,
	},
	{
		id: "items",
		accessorKey: "itemsCount",
		header: ({ column }) => (
			<DataTableColumnHeader className="w-full text-right" column={column} title="Ítems" />
		),
		cell: ({ row }) => (
			<div className="text-right tabular-nums">{row.original.itemsCount}</div>
		),
		enableSorting: true,
	},
	{
		id: "pagados",
		accessorKey: "paidCount",
		header: ({ column }) => (
			<DataTableColumnHeader className="w-full text-right" column={column} title="Pagados" />
		),
		cell: ({ row }) => (
			<div className="text-right tabular-nums">{row.original.paidCount}</div>
		),
		enableSorting: true,
	},
];
