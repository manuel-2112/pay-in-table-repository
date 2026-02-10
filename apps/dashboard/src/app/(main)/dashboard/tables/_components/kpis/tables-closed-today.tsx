"use client";

import { CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TablesClosedTodayCardProps {
	count: number | undefined;
	isLoading?: boolean;
}

export function TablesClosedTodayCard({ count, isLoading }: TablesClosedTodayCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<div className="flex items-center gap-2">
						<span className="grid size-7 place-content-center rounded-sm bg-green-500/10">
							<CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
						</span>
						Mesas cerradas hoy
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-1">
				{isLoading ? (
					<Skeleton className="h-8 w-16" />
				) : (
					<p className="font-medium text-xl tabular-nums">{count ?? 0}</p>
				)}
				<p className="text-muted-foreground text-xs">Sesiones cerradas en las últimas 24 h</p>
			</CardContent>
		</Card>
	);
}
