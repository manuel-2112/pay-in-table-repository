"use client";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Banknote } from "lucide-react";

interface PaymentsTodayCardProps {
	amountCents: number | undefined;
	isLoading?: boolean;
}

export function PaymentsTodayCard({ amountCents, isLoading }: PaymentsTodayCardProps) {
	return (
		<Card className="@container/card">
			<CardHeader>
				<CardDescription>Pagos procesados hoy</CardDescription>
				{isLoading ? (
					<Skeleton className="h-8 w-28" />
				) : (
					<CardTitle className="font-semibold @[250px]/card:text-3xl text-2xl tabular-nums">
						{formatCurrency((amountCents ?? 0) / 100, {
							currency: "CLP",
							locale: "es-CL",
							noDecimals: true,
						})}
					</CardTitle>
				)}
				<CardAction>
					<Badge variant="outline">
						<Banknote className="size-3.5" />
						Hoy
					</Badge>
				</CardAction>
			</CardHeader>
			<CardFooter className="flex-col items-start gap-1.5 text-sm">
				<div className="line-clamp-1 flex gap-2 font-medium">
					Monto total cobrado en las últimas 24 h
				</div>
				<div className="text-muted-foreground">Pagos registrados en sesiones de mesas</div>
			</CardFooter>
		</Card>
	);
}
