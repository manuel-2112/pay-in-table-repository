"use client";

import { LayoutGrid } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ActiveTablesCardProps {
	count: number | undefined;
	isLoading?: boolean;
}

export function ActiveTablesCard({ count, isLoading }: ActiveTablesCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<div className="flex items-center gap-2">
						<span className="grid size-7 place-content-center rounded-sm bg-amber-500/10">
							<LayoutGrid className="size-5 text-amber-600 dark:text-amber-400" />
						</span>
						Mesas activas
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-1">
				{isLoading ? (
					<Skeleton className="h-8 w-16" />
				) : (
					<p className="font-medium text-xl tabular-nums">{count ?? 0}</p>
				)}
				<p className="text-muted-foreground text-xs">Con sesión abierta en este momento</p>
			</CardContent>
		</Card>
	);
}
