/**
 * Centralized types and logic for the tables dashboard.
 * No UI, no Convex imports — only domain types and pure functions.
 */

// ---- View model (what the table UI consumes) ----

export type TableStatus = "libre" | "atendido" | "en_proceso_de_pago";

export interface TableRow {
	tableId: string;
	label: string;
	status: TableStatus;
	totalAmountCents: number | null;
	itemsCount: number;
	paidCount: number;
}

// ---- Minimal shapes for listTablesWithSessions result (Convex result satisfies these) ----

export interface SessionSummary {
	totalAmountCents: number;
}

export type SessionItemStatus = "available" | "reserved" | "paid";

export interface SessionItemSummary {
	status: SessionItemStatus;
}

export interface SessionPaymentSummary {
	amount: number;
}

export interface TableWithSessionEntry {
	table: { _id: string; label?: string };
	session: SessionSummary | null;
	items: SessionItemSummary[];
	payments: SessionPaymentSummary[];
}

// ---- Status derivation ----

export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
	libre: "Libre",
	atendido: "Atendido",
	en_proceso_de_pago: "En proceso de pago",
};

/**
 * Derives table status from session, items, and payments.
 * - Libre: no session or no items
 * - Atendido: active session with items, all available, no payments
 * - En proceso de pago: session with reserved/paid items or payments
 */
export function deriveTableStatus(
	session: SessionSummary | null,
	items: SessionItemSummary[],
	payments: SessionPaymentSummary[],
): TableStatus {
	if (!session) return "libre";
	if (items.length === 0) return "libre";
	const hasReservedOrPaid = items.some(
		(i) => i.status === "reserved" || i.status === "paid",
	);
	const hasPayments = payments.length > 0;
	if (hasPayments || hasReservedOrPaid) return "en_proceso_de_pago";
	return "atendido";
}

/**
 * Maps Convex listTablesWithSessions result to table rows for the data table.
 */
export function mapTablesWithSessionsToRows(
	entries: TableWithSessionEntry[],
): TableRow[] {
	return entries.map(({ table, session, items, payments }, index) => {
		const status = deriveTableStatus(session, items, payments);
		const paidCount = items.filter((i) => i.status === "paid").length;
		return {
			tableId: table._id,
			label: table.label ?? `Mesa ${index + 1}`,
			status,
			totalAmountCents: session?.totalAmountCents ?? null,
			itemsCount: items.length,
			paidCount,
		};
	});
}
