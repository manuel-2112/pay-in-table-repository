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
import { PackageCheck } from "lucide-react";

interface ItemsPaidTodayCardProps {
	count: number | undefined;
	isLoading?: boolean;
}

export function ItemsPaidTodayCard({ count, isLoading }: ItemsPaidTodayCardProps) {
	return (
		<Card className="@container/card">
			<CardHeader>
				<CardDescription>Ítems pagados hoy</CardDescription>
				{isLoading ? (
					<Skeleton className="h-8 w-16" />
				) : (
					<CardTitle className="font-semibold @[250px]/card:text-3xl text-2xl tabular-nums">
						{count ?? 0}
					</CardTitle>
				)}
				<CardAction>
					<Badge variant="outline">
						<PackageCheck className="size-3.5" />
						Hoy
					</Badge>
				</CardAction>
			</CardHeader>
			<CardFooter className="flex-col items-start gap-1.5 text-sm">
				<div className="line-clamp-1 flex gap-2 font-medium">
					En sesiones cerradas en las últimas 24 h
				</div>
				<div className="text-muted-foreground">Productos marcados como pagados</div>
			</CardFooter>
		</Card>
	);
}
