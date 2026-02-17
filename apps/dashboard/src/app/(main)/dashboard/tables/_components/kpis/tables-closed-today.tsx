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
import { CheckCircle2 } from "lucide-react";

interface TablesClosedTodayCardProps {
	count: number | undefined;
	isLoading?: boolean;
}

export function TablesClosedTodayCard({ count, isLoading }: TablesClosedTodayCardProps) {
	return (
		<Card className="@container/card">
			<CardHeader>
				<CardDescription>Mesas cerradas hoy</CardDescription>
				{isLoading ? (
					<Skeleton className="h-8 w-16" />
				) : (
					<CardTitle className="font-semibold @[250px]/card:text-3xl text-2xl tabular-nums">
						{count ?? 0}
					</CardTitle>
				)}
				<CardAction>
					<Badge variant="outline">
						<CheckCircle2 className="size-3.5" />
						Hoy
					</Badge>
				</CardAction>
			</CardHeader>
			<CardFooter className="flex-col items-start gap-1.5 text-sm">
				<div className="line-clamp-1 flex gap-2 font-medium">
					Sesiones cerradas en las últimas 24 h
				</div>
				<div className="text-muted-foreground">Cuentas cerradas y pagadas</div>
			</CardFooter>
		</Card>
	);
}
