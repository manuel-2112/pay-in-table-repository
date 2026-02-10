"use client";

import { Banknote } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface PaymentsTodayCardProps {
	amountCents: number | undefined;
	isLoading?: boolean;
}

export function PaymentsTodayCard({ amountCents, isLoading }: PaymentsTodayCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<div className="flex items-center gap-2">
						<span className="grid size-7 place-content-center rounded-sm bg-primary/10">
							<Banknote className="size-5 text-primary" />
						</span>
						Pagos procesados hoy
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-1">
				{isLoading ? (
					<Skeleton className="h-8 w-24" />
				) : (
					<p className="font-medium text-xl tabular-nums">
						{formatCurrency((amountCents ?? 0) / 100, {
							currency: "CLP",
							locale: "es-CL",
							noDecimals: true,
						})}
					</p>
				)}
				<p className="text-muted-foreground text-xs">Monto total cobrado hoy</p>
			</CardContent>
		</Card>
	);
}
