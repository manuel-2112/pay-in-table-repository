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
