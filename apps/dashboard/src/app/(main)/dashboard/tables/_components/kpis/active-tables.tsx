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
import { LayoutGrid } from "lucide-react";

interface ActiveTablesCardProps {
	count: number | undefined;
	isLoading?: boolean;
}

export function ActiveTablesCard({ count, isLoading }: ActiveTablesCardProps) {
	return (
		<Card className="@container/card">
			<CardHeader>
				<CardDescription>Mesas activas</CardDescription>
				{isLoading ? (
					<Skeleton className="h-8 w-16" />
				) : (
					<CardTitle className="font-semibold @[250px]/card:text-3xl text-2xl tabular-nums">
						{count ?? 0}
					</CardTitle>
				)}
				<CardAction>
					<Badge variant="outline">
						<LayoutGrid className="size-3.5" />
						En curso
					</Badge>
				</CardAction>
			</CardHeader>
			<CardFooter className="flex-col items-start gap-1.5 text-sm">
				<div className="line-clamp-1 flex gap-2 font-medium">
					Con sesión abierta en este momento
				</div>
				<div className="text-muted-foreground">Mesas con cuenta activa</div>
			</CardFooter>
		</Card>
	);
}
