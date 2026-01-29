import type { FlowGraph, FlowNode, FlowState } from "@/flow/types";

/**
 * Creates a new empty flow graph
 */
export function createFlowGraph(): FlowGraph {
	return {
		nodes: new Map<string, FlowNode>(),
	};
}

/**
 * Registers a node in the flow graph
 */
export function registerNode(graph: FlowGraph, node: FlowNode): void {
	if (graph.nodes.has(node.currentPage)) {
		throw new Error(
			`Node with currentPage "${node.currentPage}" already exists in graph`,
		);
	}

	graph.nodes.set(node.currentPage, node);

	// Set as entry point if it's the first node
	if (!graph.entryPoint) {
		graph.entryPoint = node.currentPage;
	}
}

/**
 * Initialize a flow from an array of nodes.
 * Convenience for defining complete flows in one place.
 */
export function initializeFlow(
	nodes: FlowNode[],
	entryPoint?: string,
): FlowGraph {
	const graph = createFlowGraph();

	for (const node of nodes) {
		registerNode(graph, node);
	}

	// Override entry point if explicitly provided
	if (entryPoint) {
		if (!graph.nodes.has(entryPoint)) {
			throw new Error(`Entry point "${entryPoint}" does not exist in nodes`);
		}
		graph.entryPoint = entryPoint;
	}

	return graph;
}

/**
 * Gets a node by its page identifier
 */
export function getNode(graph: FlowGraph, page: string): FlowNode | undefined {
	return graph.nodes.get(page);
}

/**
 * Checks if a step should be skipped based on its shouldSkip function and current state
 */
export function shouldSkipStep(
	graph: FlowGraph,
	page: string,
	state: FlowState,
): boolean {
	const node = getNode(graph, page);
	if (!node) {
		return false;
	}

	if (node.shouldSkip) {
		return node.shouldSkip(state);
	}

	return false;
}

/**
 * Resolves the next page for a given node based on current state
 */
export function resolveNextPage(
	node: FlowNode,
	state: FlowState,
): string | null {
	if (!node.nextPage) {
		return null;
	}

	// If it's a function, evaluate it with current state
	if (typeof node.nextPage === "function") {
		return node.nextPage(state);
	}

	// Otherwise, return the string directly
	return node.nextPage;
}

/**
 * Recursively finds the next non-skipped page, preventing infinite loops
 */
export function getNextNonSkippedPage(
	graph: FlowGraph,
	page: string,
	state: FlowState,
	visited: Set<string> = new Set(),
): string | null {
	// Prevent infinite loops
	if (visited.has(page)) {
		console.warn(`Circular skip condition detected for page "${page}"`);
		return null;
	}
	visited.add(page);

	// Check if current page should be skipped
	if (shouldSkipStep(graph, page, state)) {
		const node = getNode(graph, page);
		if (!node) {
			return null;
		}

		const nextPage = resolveNextPage(node, state);
		if (!nextPage || !graph.nodes.has(nextPage)) {
			return null;
		}

		// Recursively check the next page
		return getNextNonSkippedPage(graph, nextPage, state, visited);
	}

	// Page should not be skipped, return it
	return page;
}

/**
 * Gets the next page for navigation (returns first page if multiple)
 * Automatically skips steps that should be skipped
 */
export function getNextPage(
	graph: FlowGraph,
	currentPage: string,
	state: FlowState,
): string | null {
	const currentNode = getNode(graph, currentPage);
	if (!currentNode) {
		return null;
	}

	const nextPage = resolveNextPage(currentNode, state);

	if (!nextPage) {
		return null;
	}

	// Validate that the next page exists in the graph
	if (!graph.nodes.has(nextPage)) {
		console.warn(`Next page "${nextPage}" does not exist in graph`);
		return null;
	}

	// Check if the next page should be skipped and find the first non-skipped page
	return getNextNonSkippedPage(graph, nextPage, state);
}

/**
 * Gets the next page (returns as array for consistency with previous API)
 * @deprecated Consider using getNextPage instead
 */
export function getAllNextPages(
	graph: FlowGraph,
	currentPage: string,
	state: FlowState,
): string[] {
	const nextPage = getNextPage(graph, currentPage, state);
	return nextPage ? [nextPage] : [];
}

/**
 * Recursively finds the previous non-skipped page, preventing infinite loops
 */
export function getPreviousNonSkippedPage(
	graph: FlowGraph,
	page: string,
	state: FlowState,
	visited: Set<string> = new Set(),
): string | null {
	// Prevent infinite loops
	if (visited.has(page)) {
		console.warn(`Circular skip condition detected for page "${page}"`);
		return null;
	}
	visited.add(page);

	const node = getNode(graph, page);
	if (!node) {
		return null;
	}

	if (!node.previousPageFallback) {
		return null;
	}

	// Validate that the previous page exists
	if (!graph.nodes.has(node.previousPageFallback)) {
		console.warn(
			`Previous page "${node.previousPageFallback}" does not exist in graph`,
		);
		return null;
	}

	// Check if previous page should be skipped
	if (shouldSkipStep(graph, node.previousPageFallback, state)) {
		// Recursively check the previous page
		return getPreviousNonSkippedPage(
			graph,
			node.previousPageFallback,
			state,
			visited,
		);
	}

	// Previous page should not be skipped, return it
	return node.previousPageFallback;
}

/**
 * Gets the previous page for a given node
 * Automatically skips over steps that should be skipped
 */
export function getPreviousPage(
	graph: FlowGraph,
	currentPage: string,
	state: FlowState,
): string | null {
	const currentNode = getNode(graph, currentPage);
	if (!currentNode) {
		return null;
	}

	if (!currentNode.previousPageFallback) {
		return null;
	}

	// Validate that the previous page exists
	if (!graph.nodes.has(currentNode.previousPageFallback)) {
		console.warn(
			`Previous page "${currentNode.previousPageFallback}" does not exist in graph`,
		);
		return null;
	}

	// Check if previous page should be skipped and find the first non-skipped page
	return getPreviousNonSkippedPage(graph, currentPage, state);
}

/**
 * Validates that all referenced pages in the graph exist
 */
export function validateGraph(graph: FlowGraph): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	// Check that entry point exists
	if (graph.entryPoint && !graph.nodes.has(graph.entryPoint)) {
		errors.push(`Entry point "${graph.entryPoint}" does not exist in graph`);
	}

	// Validate all node references
	for (const [page, node] of graph.nodes.entries()) {
		// Check previousPageFallback reference
		if (
			node.previousPageFallback &&
			!graph.nodes.has(node.previousPageFallback)
		) {
			errors.push(
				`Node "${page}" references non-existent previous page "${node.previousPageFallback}"`,
			);
		}

		// Check nextPage reference (for string case)
		if (node.nextPage && typeof node.nextPage !== "function") {
			if (!graph.nodes.has(node.nextPage)) {
				errors.push(
					`Node "${page}" references non-existent next page "${node.nextPage}"`,
				);
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Gets all pages in the graph in topological order (if possible)
 * Falls back to registration order if cycles exist
 */
export function getPagesInOrder(graph: FlowGraph): string[] {
	const visited = new Set<string>();
	const result: string[] = [];

	function visit(page: string) {
		if (visited.has(page)) {
			return;
		}

		visited.add(page);
		const node = graph.nodes.get(page);
		if (!node) {
			return;
		}

		// Visit previous first (if exists)
		if (node.previousPageFallback) {
			visit(node.previousPageFallback);
		}

		result.push(page);

		// Visit next page
		if (node.nextPage && typeof node.nextPage !== "function") {
			visit(node.nextPage);
		}
	}

	// Start from entry point or all nodes
	if (graph.entryPoint) {
		visit(graph.entryPoint);
	}

	// Visit any remaining unvisited nodes
	for (const page of graph.nodes.keys()) {
		if (!visited.has(page)) {
			visit(page);
		}
	}

	return result;
}
