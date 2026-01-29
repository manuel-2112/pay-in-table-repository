/**
 * Example component demonstrating payment actor usage
 */

import { usePaymentWithConvex } from "@/lib/xstate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentExampleProps {
	paymentId: string;
}

export function PaymentExample({ paymentId }: PaymentExampleProps) {
	const { state, send, convexPayment, isSyncing } = usePaymentWithConvex({
		paymentId,
	});

	if (!state) {
		return (
			<Card>
				<CardContent className="p-6">
					<p>Loading payment...</p>
				</CardContent>
			</Card>
		);
	}

	const allParticipantsPaid = state.context.participants.every(
		(p) => p.status === "paid"
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Payment: {state.context.paymentId}</CardTitle>
				<CardDescription>
					Status: {state.value} {isSyncing && "• Syncing..."}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<p className="text-sm text-muted-foreground">Amount</p>
					<p className="text-2xl font-bold">
						{state.context.currency} {state.context.amount}
					</p>
				</div>

				<div>
					<p className="text-sm text-muted-foreground mb-2">Participants</p>
					<div className="space-y-2">
						{state.context.participants.map((participant) => (
							<div
								key={participant.id}
								className="flex items-center justify-between p-2 border rounded"
							>
								<div>
									<p className="font-medium">{participant.name}</p>
									<p className="text-sm text-muted-foreground">
										{state.context.currency} {participant.amount}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<span
										className={`px-2 py-1 rounded text-xs ${
											participant.status === "paid"
												? "bg-green-100 text-green-800"
												: participant.status === "failed"
													? "bg-red-100 text-red-800"
													: "bg-gray-100 text-gray-800"
										}`}
									>
										{participant.status}
									</span>
									{participant.status === "pending" && send && (
										<Button
											size="sm"
											onClick={() =>
												send({
													type: "PARTICIPANT_PAID",
													participantId: participant.id,
												})
											}
										>
											Mark Paid
										</Button>
									)}
								</div>
							</div>
						))}
					</div>
				</div>

				{send && (
					<div className="flex gap-2 pt-4">
						{state.matches("collecting") && allParticipantsPaid && (
							<Button
								onClick={() => send({ type: "PROCESS_PAYMENT" })}
								disabled={!state.can("PROCESS_PAYMENT")}
							>
								Process Payment
							</Button>
						)}
						{state.matches("collecting") && (
							<Button
								variant="outline"
								onClick={() => send({ type: "CANCEL_PAYMENT" })}
							>
								Cancel
							</Button>
						)}
					</div>
				)}

				{convexPayment && (
					<div className="pt-4 border-t text-xs text-muted-foreground">
						<p>Last synced: {new Date(convexPayment.updatedAt).toLocaleString()}</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
