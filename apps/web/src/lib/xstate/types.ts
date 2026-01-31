/**
 * Types for XState payment actors
 */

export interface PaymentContext {
	paymentId: string;
	amount: number;
	currency: string;
	status: PaymentStatus;
	participants: PaymentParticipant[];
	metadata?: Record<string, unknown>;
	createdAt: number;
	updatedAt: number;
}

export interface PaymentParticipant {
	id: string;
	name: string;
	amount: number;
	status: ParticipantStatus;
	paidAt?: number;
}

export type PaymentStatus =
	| "idle"
	| "initializing"
	| "collecting"
	| "processing"
	| "completed"
	| "failed"
	| "cancelled";

export type ParticipantStatus = "pending" | "paid" | "failed";

export type PaymentEvent =
	| { type: "INITIALIZE"; paymentId: string; amount: number; currency: string; participants: PaymentParticipant[] }
	| { type: "PARTICIPANT_PAID"; participantId: string }
	| { type: "PARTICIPANT_FAILED"; participantId: string; error?: string }
	| { type: "PROCESS_PAYMENT" }
	| { type: "COMPLETE_PAYMENT" }
	| { type: "FAIL_PAYMENT"; error: string }
	| { type: "CANCEL_PAYMENT" }
	| { type: "SYNC_STATE"; state: PaymentContext };

export interface PaymentActorRef {
	id: string;
	send: (event: PaymentEvent) => void;
	subscribe: (callback: (state: PaymentActorSnapshot) => void) => () => void;
	getSnapshot: () => PaymentActorSnapshot;
	stop: () => void;
}

export interface PaymentActorSnapshot {
	value: PaymentStatus;
	context: PaymentContext;
	matches: (state: PaymentStatus) => boolean;
	can: (event: PaymentEvent["type"]) => boolean;
}

// --- Session item (table checkout) ---

export type SessionItemStatus = "available" | "reserved" | "paid";

export interface ItemContext {
	sessionItemId: string;
	sessionId: string;
	name: string;
	quantity: number;
	price: number;
	reservedByClientId: string | undefined;
	/** Local client UUID; same for all items in this browser */
	clientId: string | undefined;
	/** Set at actor creation so invoke can call Convex (not persisted) */
	reserveItem?: (sessionItemId: string, clientId: string) => Promise<void>;
	releaseItem?: (sessionItemId: string, clientId: string) => Promise<void>;
}

export type ItemEvent =
	| { type: "RESERVE"; clientId: string }
	| { type: "RELEASE" }
	| { type: "START_PAYMENT" }
	| { type: "PAYMENT_CONFIRMED" }
	| { type: "PAYMENT_FAILED" }
	| { type: "PAYMENT_CANCELLED" }
	| { type: "SYNC_FROM_SERVER"; status: SessionItemStatus; reservedByClientId?: string };

export interface ItemInput extends ItemContext {
	/** Called when reserving; (sessionItemId, clientId) => Promise<void> */
	reserveItem: (sessionItemId: string, clientId: string) => Promise<void>;
	/** Called when releasing; (sessionItemId, clientId) => Promise<void> */
	releaseItem: (sessionItemId: string, clientId: string) => Promise<void>;
}

export type ItemStateValue =
	| "available"
	| "reserving"
	| "reserved"
	| "releasing"
	| "paying"
	| "confirming"
	| "paid";

export interface ItemActorSnapshot {
	value: ItemStateValue;
	context: ItemContext;
	matches: (state: ItemStateValue) => boolean;
	can: (event: ItemEvent["type"]) => boolean;
}

// --- Checkout coordinator (table session) ---

export interface CheckoutCoordinatorContext {
	accessToken: string;
	clientId: string;
	sessionId: string | undefined;
	session: { totalAmountCents: number } | null;
	/** Map sessionItemId -> actor ref (or snapshot) for items reserved by this client */
	itemActors: Map<string, { sessionItemId: string; reservedByClientId: string }>;
	/** Total amount to pay (sum of reserved items by this client) */
	totalToPayCents: number;
}

export type CheckoutCoordinatorEvent =
	| { type: "SESSION_LOADED"; accessToken: string; clientId: string; session: { _id: string; totalAmountCents: number } | null; items: Array<{ _id: string; status: SessionItemStatus; reservedByClientId?: string }> }
	| { type: "ITEM_RESERVED"; sessionItemId: string; reservedByClientId: string }
	| { type: "ITEM_RELEASED"; sessionItemId: string }
	| { type: "START_PAYMENT" }
	| { type: "PAYMENT_CONFIRMED"; sessionItemIds: string[] }
	| { type: "PAYMENT_FAILED" }
	| { type: "PAYMENT_CANCELLED" };
