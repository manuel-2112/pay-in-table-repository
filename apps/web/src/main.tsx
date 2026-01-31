import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import {
	RouterProvider,
	createRouter as createTanStackRouter,
} from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { CatchBoundary } from "@tanstack/react-router";
import { PaymentActorProvider } from "./lib/xstate";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./App.css";
import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";
import { QueryClient } from "@tanstack/react-query";

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL ?? "";

/** Single Convex client for both ConvexProvider and ConvexQueryClient (avoids duplicate WebSocket). */
export function createConvexClient() {
	return new ConvexReactClient(CONVEX_URL);
}

export function createRouter(convexClient: InstanceType<typeof ConvexReactClient>) {
	const convexQueryClient = new ConvexQueryClient(convexClient);

	const queryClient: QueryClient = new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: convexQueryClient.hashFn(),
				queryFn: convexQueryClient.queryFn(),
			},
		},
	});
	convexQueryClient.connect(queryClient);

	const router = routerWithQueryClient(
		createTanStackRouter({
			routeTree,
			defaultPreload: "intent",
			context: { queryClient },
			Wrap: ({ children }) => (
				<CatchBoundary
					errorComponent={(e: any) => (
						<div>Error: {JSON.stringify(e)}</div>
					)}
					getResetKey={() => "error"}
				>
					<PaymentActorProvider>
						{children}
					</PaymentActorProvider>
				</CatchBoundary>
			),
		}),
		queryClient
	);

	return router;
}

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof createRouter>;
	}
}

// Render the app – single Convex client to avoid duplicate WebSocket connections
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
	const convexClient = createConvexClient();
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<ConvexProvider client={convexClient}>
				<RouterProvider router={createRouter(convexClient)} />
			</ConvexProvider>
		</StrictMode>
	);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
