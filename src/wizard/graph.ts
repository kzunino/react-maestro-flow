import type { WizardGraph, WizardNode, WizardState } from "@/wizard/types";

/**
 * Creates a new empty wizard graph
 */
export function createWizardGraph(): WizardGraph {
	return {
		nodes: new Map<string, WizardNode>(),
	};
}

/**
 * Registers a node in the wizard graph
 */
export function registerNode(graph: WizardGraph, node: WizardNode): void {
	if (graph.nodes.has(node.page)) {
		throw new Error(`Node with page "${node.page}" already exists in graph`);
	}

	graph.nodes.set(node.page, node);

	// Set as entry point if it's the first node
	if (!graph.entryPoint) {
		graph.entryPoint = node.page;
	}
}

/**
 * Creates a wizard graph from an array of nodes
 * This is a convenience function for defining complete wizards in one place
 */
export function createWizardGraphFromNodes(
	nodes: WizardNode[],
	entryPoint?: string,
): WizardGraph {
	const graph = createWizardGraph();

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
export function getNode(
	graph: WizardGraph,
	page: string,
): WizardNode | undefined {
	return graph.nodes.get(page);
}

/**
 * Checks if a step should be skipped based on its shouldSkip function and current state
 */
export function shouldSkipStep(
	graph: WizardGraph,
	page: string,
	state: WizardState,
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
 * Resolves the next page(s) for a given node based on current state
 */
export function resolveNextPage(
	node: WizardNode,
	state: WizardState,
): string | string[] | null {
	if (!node.next) {
		return null;
	}

	// If it's a function, evaluate it with current state
	if (typeof node.next === "function") {
		return node.next(state);
	}

	// Otherwise, return the string or array directly
	return node.next;
}

/**
 * Recursively finds the next non-skipped page, preventing infinite loops
 */
export function getNextNonSkippedPage(
	graph: WizardGraph,
	page: string,
	state: WizardState,
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

		const next = resolveNextPage(node, state);
		if (next === null) {
			return null;
		}

		// If it's an array, try the first page
		const nextPage = Array.isArray(next) ? next[0] : next;

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
	graph: WizardGraph,
	currentPage: string,
	state: WizardState,
): string | null {
	const currentNode = getNode(graph, currentPage);
	if (!currentNode) {
		return null;
	}

	const next = resolveNextPage(currentNode, state);

	if (next === null) {
		return null;
	}

	// If it's an array, return the first page
	const nextPage = Array.isArray(next)
		? next.length > 0
			? next[0]
			: null
		: next;

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
 * Gets all possible next pages (useful for conditional branching)
 */
export function getAllNextPages(
	graph: WizardGraph,
	currentPage: string,
	state: WizardState,
): string[] {
	const currentNode = getNode(graph, currentPage);
	if (!currentNode) {
		return [];
	}

	const next = resolveNextPage(currentNode, state);

	if (next === null) {
		return [];
	}

	if (Array.isArray(next)) {
		// Filter to only include pages that exist in the graph
		return next.filter((page) => graph.nodes.has(page));
	}

	// Single page
	if (graph.nodes.has(next)) {
		return [next];
	}

	return [];
}

/**
 * Recursively finds the previous non-skipped page, preventing infinite loops
 */
export function getPreviousNonSkippedPage(
	graph: WizardGraph,
	page: string,
	state: WizardState,
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

	if (!node.previous) {
		return null;
	}

	// Validate that the previous page exists
	if (!graph.nodes.has(node.previous)) {
		console.warn(`Previous page "${node.previous}" does not exist in graph`);
		return null;
	}

	// Check if previous page should be skipped
	if (shouldSkipStep(graph, node.previous, state)) {
		// Recursively check the previous page
		return getPreviousNonSkippedPage(graph, node.previous, state, visited);
	}

	// Previous page should not be skipped, return it
	return node.previous;
}

/**
 * Gets the previous page for a given node
 * Automatically skips over steps that should be skipped
 */
export function getPreviousPage(
	graph: WizardGraph,
	currentPage: string,
	state: WizardState,
): string | null {
	const currentNode = getNode(graph, currentPage);
	if (!currentNode) {
		return null;
	}

	if (!currentNode.previous) {
		return null;
	}

	// Validate that the previous page exists
	if (!graph.nodes.has(currentNode.previous)) {
		console.warn(
			`Previous page "${currentNode.previous}" does not exist in graph`,
		);
		return null;
	}

	// Check if previous page should be skipped and find the first non-skipped page
	return getPreviousNonSkippedPage(graph, currentPage, state);
}

/**
 * Validates that all referenced pages in the graph exist
 */
export function validateGraph(graph: WizardGraph): {
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
		// Check previous reference
		if (node.previous && !graph.nodes.has(node.previous)) {
			errors.push(
				`Node "${page}" references non-existent previous page "${node.previous}"`,
			);
		}

		// Check next references (for string/array cases)
		if (node.next && typeof node.next !== "function") {
			const nextPages = Array.isArray(node.next) ? node.next : [node.next];
			for (const nextPage of nextPages) {
				if (!graph.nodes.has(nextPage)) {
					errors.push(
						`Node "${page}" references non-existent next page "${nextPage}"`,
					);
				}
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
export function getPagesInOrder(graph: WizardGraph): string[] {
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
		if (node.previous) {
			visit(node.previous);
		}

		result.push(page);

		// Visit next pages
		if (node.next && typeof node.next !== "function") {
			const nextPages = Array.isArray(node.next) ? node.next : [node.next];
			for (const nextPage of nextPages) {
				visit(nextPage);
			}
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
