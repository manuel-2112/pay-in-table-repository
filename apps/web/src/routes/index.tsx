import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	return (
		<div className="min-h-screen bg-slate-50 p-6 dark:bg-zinc-950">
			<div className="max-w-6xl mx-auto">
				<div className="text-center mb-12">
					<h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
						PayInTable
					</h1>
					<p className="text-slate-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto mb-8">
						Payment coordination platform
					</p>
					<Link
						to="/demo"
						className="inline-flex items-center justify-center rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 font-medium hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors"
					>
						Ver flujo demo (sin backend)
					</Link>
				</div>
			</div>
		</div>
	);
}
