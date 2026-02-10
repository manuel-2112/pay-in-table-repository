"use client";

import { PackageCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ItemsPaidTodayCardProps {
	count: number | undefined;
	isLoading?: boolean;
}

export function ItemsPaidTodayCard({ count, isLoading }: ItemsPaidTodayCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<div className="flex items-center gap-2">
						<span className="grid size-7 place-content-center rounded-sm bg-blue-500/10">
							<PackageCheck className="size-5 text-blue-600 dark:text-blue-400" />
						</span>
						Ítems pagados hoy
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-1">
				{isLoading ? (
					<Skeleton className="h-8 w-16" />
				) : (
					<p className="font-medium text-xl tabular-nums">{count ?? 0}</p>
				)}
				<p className="text-muted-foreground text-xs">En sesiones cerradas en las últimas 24 h</p>
			</CardContent>
		</Card>
	);
}
