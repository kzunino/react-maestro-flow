import { FlowContext } from "@/flow/FlowContext";
import { Presenter } from "@/flow/NodePresenter";
import { defaultStateManager } from "@/flow/flowStateManagers";
import {
	getNextPage,
	getNode,
	getPreviousPage,
	resolveNextPage,
	shouldSkipStep,
} from "@/flow/graphHelpers";
import type {
	ComponentLoader,
	FlowContextValue,
	FlowGraph,
	FlowState,
	FlowStateByPage,
	UrlParamsAdapter,
} from "@/flow/types";
import { useUrlParams } from "@/flow/useURLParams";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Configuration options for the Flow component
 */
export type FlowConfig = {
	/**
	 * Optional URL params adapter (defaults to browser query params implementation).
	 *
	 * Controls how the flow reads/writes URL parameters (page, id, etc.).
	 *
	 * - **Omit (default)**: Uses query params like `?page=pageA&id=xyz`
	 * - **Path-based URLs**: Pass `createPathParamsAdapter({ template: "/[id]/page/[page]" })`
	 *   to use path segments like `/test123/page/pageA`
	 * - **Framework adapters**: Use `createPathParamsAdapterFromProps` for Next.js/Remix
	 *   or create a custom adapter for other routing libraries
	 *
	 * @example
	 * ```ts
	 * // Query params (default - no adapter needed)
	 * <Flow graph={graph} /> // URLs: ?page=pageA&id=xyz
	 *
	 * // Path-based URLs
	 * const adapter = createPathParamsAdapter({ template: "/[id]/page/[page]" });
	 * <Flow graph={graph} config={{ urlParamsAdapter: adapter }} />
	 * // URLs: /test123/page/pageA
	 * ```
	 */
	urlParamsAdapter?: UrlParamsAdapter;

	/**
	 * Optional URL parameter name for the current page (defaults to "page")
	 */
	pageParamName?: string;

	/**
	 * Optional URL parameter name for the flow UUID (defaults to "id")
	 */
	uuidParamName?: string;

	/**
	 * Optional callback when page changes. Receives the new page, previous page
	 * (null on initial load), and the accumulated state (merged from all pages).
	 * Fires on initial load and every navigation.
	 */
	onPageChange?: (
		page: string | null,
		previousPage: string | null,
		state: FlowStateByPage,
	) => void;

	/**
	 * Whether to use the internal state system (session storage).
	 * Default: true. Set to false to use navigation only with no persisted state.
	 * When false, state is kept in memory only (lost on refresh).
	 */
	enableState?: boolean;

	/**
	 * Map of page identifiers to component loaders
	 * Each loader should return a promise that resolves to a component with a default export
	 */
	componentLoaders?: Map<string, ComponentLoader>;
};

/**
 * Props for the Flow component
 */
export type FlowProps = {
	/**
	 * The flow graph definition (nodes + component loaders)
	 */
	graph: FlowGraph;

	/**
	 * Optional configuration object
	 */
	config?: FlowConfig;
};

/**
 * Main Flow component. Orchestrates graph navigation, state management, and URL params.
 */
/**
 * Generates a UUID and returns the last 5 characters (digits/letters)
 */
function generateShortUuid(): string {
	// Generate a UUID and take the last 5 characters
	// Remove hyphens first to ensure we get 5 alphanumeric characters
	const uuid = crypto.randomUUID().replace(/-/g, "");
	return uuid.slice(-5);
}

export function Flow({ graph, config = {} }: FlowProps) {
	const {
		urlParamsAdapter,
		pageParamName = "page",
		uuidParamName = "id",
		onPageChange,
		enableState = true,
		componentLoaders,
	} = config;

	const stateManager = defaultStateManager;

	type PageStateEntry = { page: string; state: FlowState };
	const [memoryEntries, setMemoryEntries] = useState<PageStateEntry[]>([]);

	const mergeEntries = useCallback(
		(entries: PageStateEntry[]): FlowStateByPage => {
			const byPage: FlowStateByPage = {};
			for (const e of entries) {
				byPage[e.page] = { ...e.state };
			}
			return byPage;
		},
		[],
	);

	// Build component loaders map from graph if not provided
	const componentLoadersMap = useMemo(() => {
		if (componentLoaders) {
			return componentLoaders;
		}
		// If not provided, create an empty map (users must provide componentLoaders)
		return new Map<string, ComponentLoader>();
	}, [componentLoaders]);

	const urlParams = useUrlParams(urlParamsAdapter);

	// Get or generate UUID (last 5 digits)
	const [flowUuid, setFlowUuid] = useState<string>(() => {
		const existingUuid = urlParams.getParam(uuidParamName);
		if (existingUuid) {
			return existingUuid;
		}
		const newUuid = generateShortUuid();
		// Set it in URL if it doesn't exist
		if (typeof window !== "undefined") {
			urlParams.setParam(uuidParamName, newUuid);
		}
		return newUuid;
	});

	// Sync UUID with URL param
	useEffect(() => {
		const urlUuid = urlParams.getParam(uuidParamName);
		if (urlUuid && urlUuid !== flowUuid) {
			setFlowUuid(urlUuid);
		} else if (!urlUuid) {
			urlParams.setParam(uuidParamName, flowUuid);
		}
	}, [flowUuid, uuidParamName, urlParams]);

	// Determine initial page - start with null to ensure validation completes before rendering
	// We'll validate in useEffect to ensure session storage is accessible
	const [currentPage, setCurrentPage] = useState<string | null>(null);

	// Track if we're currently validating initial state (entry point + session storage check)
	// This prevents rendering until we've confirmed we're either on entry point or state exists
	// Always start with true - we'll validate in the effect
	const [isValidating, setIsValidating] = useState(true);

	// Track if we're currently checking if a page should be skipped
	const [isCheckingSkip, setIsCheckingSkip] = useState(false);
	const skipCheckRef = useRef(false);
	const hasInitializedRef = useRef(false);

	// State version counter to trigger re-computation of allState
	const [stateVersion, setStateVersion] = useState(0);

	// Get accumulated state from all pages
	const allState = useMemo(() => {
		if (enableState) {
			const _ = stateVersion;
			return stateManager.getAllState(graph, flowUuid);
		}
		return mergeEntries(memoryEntries);
	}, [
		enableState,
		stateVersion,
		graph,
		stateManager,
		flowUuid,
		mergeEntries,
		memoryEntries,
	]);

	// Early validation check: Ensure we're either on entry point or state exists
	// This runs first to prevent any rendering until validation is complete
	useEffect(() => {
		if (!isValidating) {
			return; // Validation already complete
		}

		const urlPage = urlParams.getParam(pageParamName);
		const entryPoint = graph.entryPoint || null;
		const isEntryPoint = urlPage === entryPoint;

		// If we're on entry point or no page param, no validation needed (will go to entry point)
		if (isEntryPoint || !urlPage) {
			const initialPage = urlPage || entryPoint;
			setCurrentPage(initialPage);
			setIsValidating(false);
			onPageChange?.(initialPage, null, allState);
			return;
		}

		// Check page existence first: if page doesn't exist, set to not found
		if (!graph.nodes.has(urlPage)) {
			setCurrentPage("__notfound__");
			setIsValidating(false);
			onPageChange?.("__notfound__", null, allState);
			return;
		}

		// When state enabled: check if UUID has state in session storage
		if (enableState) {
			const uuidExists = stateManager.hasState(flowUuid);
			if (!uuidExists) {
				setCurrentPage("__expired__");
				setIsValidating(false);
				onPageChange?.("__expired__", null, allState);
				return;
			}
		}

		// Validation passes
		setCurrentPage(urlPage);
		setIsValidating(false);
		onPageChange?.(urlPage, null, allState);
	}, [
		isValidating,
		urlParams,
		pageParamName,
		graph,
		flowUuid,
		stateManager,
		enableState,
		onPageChange,
		allState,
	]);

	// Sync current page with URL param changes (browser back/forward)
	// URL is the source of truth - when URL changes, it drives what page is shown
	// Also validates UUID existence and page validity BEFORE pre-registering state
	// Run validation immediately on mount to ensure correct initial state
	useEffect(() => {
		// Don't proceed if still validating - wait for validation to complete
		if (isValidating) {
			return;
		}

		const urlPage = urlParams.params[pageParamName] ?? null;
		const entryPoint = graph.entryPoint || null;
		const isEntryPoint = urlPage === entryPoint;
		const uuidExists = enableState ? stateManager.hasState(flowUuid) : false;

		// Check page existence first: unknown page → not found (regardless of UUID state)
		if (urlPage && !graph.nodes.has(urlPage)) {
			if (currentPage !== "__notfound__") {
				setCurrentPage("__notfound__");
				onPageChange?.("__notfound__", currentPage, allState);
			}
			return;
		}

		// When state enabled: page exists but no state for UUID → expired
		if (enableState && !uuidExists && urlPage && !isEntryPoint) {
			if (currentPage !== "__expired__") {
				setCurrentPage("__expired__");
				onPageChange?.("__expired__", currentPage, allState);
			}
			return;
		}

		// Validation passes - ensure currentPage matches URL page if it was set to error state initially
		if (
			(currentPage === "__expired__" || currentPage === "__notfound__") &&
			urlPage &&
			graph.nodes.has(urlPage)
		) {
			setCurrentPage(urlPage);
			onPageChange?.(urlPage, currentPage, allState);
		}

		// If we're already showing an error page but validation passes, don't proceed
		if (currentPage === "__expired__" || currentPage === "__notfound__") {
			if (
				urlPage &&
				urlPage !== currentPage &&
				graph.nodes.has(urlPage) &&
				(enableState ? uuidExists : true)
			) {
				setCurrentPage(urlPage);
				onPageChange?.(urlPage, currentPage, allState);
			} else {
				return;
			}
		}

		// When state enabled: pre-register state for new flow starts
		if (enableState) {
			if (
				!hasInitializedRef.current &&
				!uuidExists &&
				(isEntryPoint || !urlPage)
			) {
				stateManager.preRegisterState(graph, flowUuid);
				hasInitializedRef.current = true;
				setStateVersion((prev) => prev + 1);
			} else if (uuidExists) {
				hasInitializedRef.current = true;
			}
		} else {
			hasInitializedRef.current = true;
		}

		// If URL has a page param and it's different from current page
		if (urlPage && urlPage !== currentPage && graph.nodes.has(urlPage)) {
			// Check if the URL page should be skipped (handles browser back/forward landing on skipped pages)
			if (shouldSkipStep(graph, urlPage, allState)) {
				// Determine direction: if urlPage is the previous page from current, we're going back
				const prevFromCurrent = currentPage
					? getPreviousPage(graph, currentPage, allState)
					: null;
				const isGoingBack = prevFromCurrent === urlPage;

				// Get the appropriate non-skipped page based on direction
				const targetPage = isGoingBack
					? getPreviousPage(graph, urlPage, allState)
					: getNextPage(graph, urlPage, allState);

				if (targetPage) {
					// Replace the skipped page in URL with the appropriate non-skipped page
					urlParams.replaceParam(pageParamName, targetPage);
					setCurrentPage(targetPage);
					onPageChange?.(targetPage, currentPage, allState);
				}
			} else {
				// Normal navigation - page is not skipped, URL drives the state
				setCurrentPage(urlPage);
				onPageChange?.(urlPage, currentPage, allState);
			}
		} else if (!urlPage) {
			// If URL has no page param, sync to entry point
			if (entryPoint && entryPoint !== currentPage) {
				const previousPage = currentPage;
				setCurrentPage(entryPoint);
				urlParams.setParam(pageParamName, entryPoint);
				onPageChange?.(entryPoint, previousPage, allState);
			} else if (!entryPoint && currentPage) {
				// No entry point and no URL param, clear current page
				const previousPage = currentPage;
				setCurrentPage(null);
				onPageChange?.(null, previousPage, allState);
			}
		}
	}, [
		urlParams.params,
		graph,
		currentPage,
		allState,
		onPageChange,
		pageParamName,
		urlParams,
		stateManager,
		flowUuid,
		isValidating,
		enableState,
	]);

	// Check if current page should be skipped and navigate if needed
	// This runs when a page loads to handle conditional skipping
	useEffect(() => {
		// Reset skip check ref when page changes
		skipCheckRef.current = false;

		if (!currentPage) {
			return;
		}

		// Check if current page should be skipped
		if (shouldSkipStep(graph, currentPage, allState)) {
			setIsCheckingSkip(true);
			skipCheckRef.current = true;

			// Find next non-skipped page
			const nextPage = getNextPage(graph, currentPage, allState);

			if (nextPage) {
				// Replace URL (don't add to history) since we're skipping
				urlParams.replaceParam(pageParamName, nextPage);
				setCurrentPage(nextPage);
				onPageChange?.(nextPage, currentPage, allState);
			}

			setIsCheckingSkip(false);
		}
	}, [currentPage, graph, allState, pageParamName, urlParams, onPageChange]);

	// Navigation functions
	const goToNext = useCallback(() => {
		if (!currentPage) {
			return;
		}

		const nextPage = getNextPage(graph, currentPage, allState);
		if (!nextPage) {
			return;
		}

		const previousPage = currentPage;

		// Check if we're skipping any steps
		// If the next page is different from what would be the direct next,
		// we're skipping steps
		const currentNode = getNode(graph, currentPage);
		const directNext = currentNode
			? resolveNextPage(currentNode, allState)
			: null;

		// If nextPage is different from directNext, we skipped steps
		const isSkipping = directNext !== null && directNext !== nextPage;

		// Use replaceParam if skipping (to remove skipped steps from history)
		// Otherwise use setParam (normal navigation adds to history)
		if (isSkipping) {
			// When skipping, replace current entry to avoid skipped pages in history
			urlParams.replaceParam(pageParamName, nextPage);
		} else {
			// Normal navigation - add to history
			urlParams.setParam(pageParamName, nextPage);
		}

		setCurrentPage(nextPage);
		onPageChange?.(nextPage, previousPage, allState);
	}, [graph, currentPage, allState, onPageChange, pageParamName, urlParams]);

	const goToPrevious = useCallback(() => {
		// Use browser history back - the history is already correct because skipped pages
		// are replaced with replaceParam, so history.back() will go to the correct previous page
		if (typeof window !== "undefined" && window.history.length > 1) {
			window.history.back();
		}
	}, []);

	const goToPage = useCallback(
		(page: string) => {
			if (!graph.nodes.has(page)) {
				console.warn(`Page "${page}" does not exist in graph`);
				return;
			}

			const previousPage = currentPage;

			setCurrentPage(page);
			urlParams.setParam(pageParamName, page);
			onPageChange?.(page, previousPage, allState);
		},
		[graph, currentPage, allState, onPageChange, pageParamName, urlParams],
	);

	const skipToPage = useCallback(
		(page: string) => {
			if (!graph.nodes.has(page)) {
				console.warn(`Page "${page}" does not exist in graph`);
				return;
			}

			const previousPage = currentPage;

			setCurrentPage(page);
			urlParams.replaceParam(pageParamName, page);
			onPageChange?.(page, previousPage, allState);
		},
		[graph, currentPage, allState, onPageChange, pageParamName, urlParams],
	);

	// Skip current page and navigate to next non-skipped page
	// This can be called from within a page component after loading
	const skipCurrentPage = useCallback(() => {
		if (!currentPage) {
			return;
		}

		setIsCheckingSkip(true);
		skipCheckRef.current = true;

		// Find next non-skipped page
		const nextPage = getNextPage(graph, currentPage, allState);

		if (nextPage) {
			// Replace URL (don't add to history) since we're skipping
			// This ensures skipped pages don't appear in browser history
			urlParams.replaceParam(pageParamName, nextPage);
			setCurrentPage(nextPage);
			onPageChange?.(nextPage, currentPage, allState);
		}

		setIsCheckingSkip(false);
	}, [currentPage, graph, allState, pageParamName, urlParams, onPageChange]);

	// Complete flow and clear state (session storage when enabled, in-memory when disabled)
	// User is responsible for handling navigation/redirect after calling this
	const completeFlow = useCallback(() => {
		if (enableState) {
			stateManager.clearState(flowUuid);
		} else {
			setMemoryEntries([]);
		}
	}, [enableState, stateManager, flowUuid]);

	// State update functions
	const updateState = useCallback(
		(key: string, value: unknown) => {
			if (!currentPage) return;
			if (enableState) {
				stateManager.setState(flowUuid, currentPage, key, value);
				setStateVersion((prev) => prev + 1);
			} else {
				setMemoryEntries((prev) => {
					const next = [...prev];
					const i = next.findIndex((e) => e.page === currentPage);
					const entry =
						i >= 0 ? { ...next[i] } : { page: currentPage, state: {} };
					entry.state = { ...entry.state, [key]: value };
					if (i >= 0) next[i] = entry;
					else next.push(entry);
					return next;
				});
			}
		},
		[currentPage, enableState, stateManager, flowUuid],
	);

	const updateStateBatch = useCallback(
		(updates: Record<string, unknown>) => {
			if (!currentPage) return;
			if (enableState) {
				stateManager.setStateBatch(flowUuid, currentPage, updates);
				setStateVersion((prev) => prev + 1);
			} else {
				setMemoryEntries((prev) => {
					const next = [...prev];
					const i = next.findIndex((e) => e.page === currentPage);
					const entry =
						i >= 0 ? { ...next[i] } : { page: currentPage, state: {} };
					entry.state = { ...entry.state, ...updates };
					if (i >= 0) next[i] = entry;
					else next.push(entry);
					return next;
				});
			}
		},
		[currentPage, enableState, stateManager, flowUuid],
	);

	const getPageState = useCallback(
		(page: string) => {
			if (enableState) {
				return stateManager.getState(flowUuid, page);
			}
			const entry = memoryEntries.find((e) => e.page === page);
			return entry?.state ?? {};
		},
		[enableState, stateManager, flowUuid, memoryEntries],
	);

	// Helper functions
	const getCurrentNode = useCallback(() => {
		if (!currentPage) {
			return undefined;
		}
		return getNode(graph, currentPage);
	}, [graph, currentPage]);

	const getNodeByPage = useCallback(
		(page: string) => {
			return getNode(graph, page);
		},
		[graph],
	);

	const hasNext = useCallback(() => {
		if (!currentPage) {
			return false;
		}
		return getNextPage(graph, currentPage, allState) !== null;
	}, [graph, currentPage, allState]);

	// Build context value
	const contextValue: FlowContextValue = useMemo(
		() => ({
			currentPage,
			state: allState,
			goToNext,
			goToPrevious,
			goToPage,
			skipToPage,
			updateState,
			updateStateBatch,
			getPageState,
			getCurrentNode,
			getNode: getNodeByPage,
			hasNext,
			skipCurrentPage,
			completeFlow,
			getUrlParam: urlParams.getParam,
			getAllUrlParams: urlParams.getAllParams,
			urlParams: urlParams.params,
		}),
		[
			currentPage,
			allState,
			goToNext,
			goToPrevious,
			goToPage,
			skipToPage,
			updateState,
			updateStateBatch,
			getPageState,
			getCurrentNode,
			getNodeByPage,
			hasNext,
			skipCurrentPage,
			completeFlow,
			urlParams,
		],
	);

	const currentNode = getCurrentNode();

	// Don't render anything while validating initial state (entry point + session storage check)
	// This prevents flicker when navigating to a non-entry-point page without state
	if (isValidating) {
		return null;
	}

	if (isCheckingSkip) {
		return (
			<FlowContext.Provider value={contextValue}>
				<div />
			</FlowContext.Provider>
		);
	}

	return (
		<FlowContext.Provider value={contextValue}>
			<Presenter
				page={currentPage}
				node={currentNode}
				componentLoaders={componentLoadersMap}
			/>
		</FlowContext.Provider>
	);
}
