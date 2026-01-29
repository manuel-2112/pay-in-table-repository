import { createFileRoute } from "@tanstack/react-router";
import "../App.css";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	return (
		<div className="min-h-screen bg-slate-50 p-6">
			<div className="max-w-6xl mx-auto">
				<div className="text-center mb-12">
					<h1 className="text-5xl font-bold text-slate-900 mb-4">
						PayInTable
					</h1>
					<p className="text-slate-600 text-lg max-w-2xl mx-auto">
						Payment coordination platform
					</p>
				</div>
			</div>
		</div>
	);
}
