import type { FlowGraph, FlowNode } from "react-maestro-flow";
import { initializeFlow } from "react-maestro-flow";

enum Page {
	PageA = "pageA",
	PageB = "pageB",
	PageC = "pageC",
	PageD = "pageD",
	PageE = "pageE",
}

const nodes: FlowNode[] = [
	{
		currentPage: Page.PageA,
		nextPage: Page.PageB,
	},
	{
		currentPage: Page.PageB,
		// Conditional routing: premium → E, standard → C (or D if skipDetails)
		// State is keyed by page: state.pageB.userType, state.pageA.name, etc.
		nextPage: (state) => {
			const pageB = state.pageB as Record<string, unknown> | undefined;
			if (pageB?.userType === "premium") return Page.PageE;
			if (pageB?.skipDetails === true) return Page.PageD;
			return Page.PageC;
		},
	},
	{
		currentPage: Page.PageC,
		previousPageFallback: Page.PageB,
		nextPage: Page.PageD,
		shouldSkip: (state) => {
			const pageB = state.pageB as Record<string, unknown> | undefined;
			return pageB?.skipDetails === true;
		},
	},
	{
		currentPage: Page.PageD,
		previousPageFallback: Page.PageB, // Back from D goes to B (skipped C doesn't appear in history)
	},
	{
		currentPage: Page.PageE,
		nextPage: Page.PageD,
	},
];

export const graph: FlowGraph = initializeFlow(nodes, Page.PageA);

export const componentLoaders = new Map([
	[Page.PageA, () => import("./pages/PageA")],
	[Page.PageB, () => import("./pages/PageB")],
	[Page.PageC, () => import("./pages/PageC")],
	[Page.PageD, () => import("./pages/PageD")],
	[Page.PageE, () => import("./pages/PageE")],
	["__expired__", () => import("./pages/Expired")],
	["__notfound__", () => import("./pages/PageNotFound")],
]);
