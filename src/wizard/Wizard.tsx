
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	getNextPage,
	getNode,
	getPreviousPage,
	shouldSkipStep,
} from "@/wizard/graph";
import { Presenter } from "@/wizard/Presenter";
import { defaultStateManager, type WizardStateManager } from "@/wizard/state";
import type {
	ComponentLoader,
	UrlParamsAdapter,
	WizardContextValue,
	WizardGraph,
} from "@/wizard/types";
import { useUrlParams } from "@/wizard/url-params";
import { WizardContext } from "@/wizard/WizardContext";

/**
 * Configuration options for the Wizard component
 */
export type WizardConfig = {
	/**
	 * Optional URL params adapter (defaults to browser implementation)
	 */
	urlParamsAdapter?: UrlParamsAdapter;

	/**
	 * Optional state manager (defaults to default instance)
	 */
	stateManager?: WizardStateManager;

	/**
	 * Optional URL parameter name for the current page (defaults to "page")
	 */
	pageParamName?: string;

	/**
	 * Optional URL parameter name for the wizard UUID (defaults to "id")
	 */
	uuidParamName?: string;

	/**
	 * Optional loading fallback for Presenter
	 */
	loadingFallback?: React.ReactNode;

	/**
	 * Optional unknown page fallback for Presenter
	 */
	unknownPageFallback?: React.ReactNode;

	/**
	 * Optional callback when page changes
	 */
	onPageChange?: (page: string | null, previousPage: string | null) => void;

	/**
	 * Map of page identifiers to component loaders
	 * Each loader should return a promise that resolves to a component with a default export
	 */
	componentLoaders?: Map<string, ComponentLoader>;
};

/**
 * Props for the Wizard component
 */
export type WizardProps = {
	/**
	 * The wizard graph definition (nodes contain component loaders)
	 */
	graph: WizardGraph;

	/**
	 * Optional configuration object
	 */
	config?: WizardConfig;
};

/**
 * Main Wizard component that orchestrates graph navigation, state management, and URL params
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

export function Wizard({ graph, config = {} }: WizardProps) {
	const {
		urlParamsAdapter,
		stateManager = defaultStateManager,
		pageParamName = "page",
		uuidParamName = "id",
		loadingFallback,
		unknownPageFallback,
		onPageChange,
		componentLoaders,
	} = config;

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
	const [wizardUuid, setWizardUuid] = useState<string>(() => {
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
		if (urlUuid && urlUuid !== wizardUuid) {
			setWizardUuid(urlUuid);
		} else if (!urlUuid) {
			urlParams.setParam(uuidParamName, wizardUuid);
		}
	}, [wizardUuid, uuidParamName, urlParams]);

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
	// We use stateVersion to force re-computation of allState
	const allState = useMemo(() => {
		// Force dependency on stateVersion by using it in the computation
		// This ensures the memo recomputes when state updates
		const _ = stateVersion;
		return stateManager.getAllState(graph, wizardUuid);
	}, [graph, stateManager, wizardUuid, stateVersion]);

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
			setCurrentPage(urlPage || entryPoint);
			setIsValidating(false);
			return;
		}

		// Not on entry point - must check if state exists in session storage
		// Check if UUID exists in session storage
		const uuidExists = stateManager.hasState(wizardUuid);

		// If not on entry point and no state exists, show expired
		if (!uuidExists) {
			setCurrentPage("__expired__");
			setIsValidating(false);
			return;
		}

		// State exists - check if page exists in graph
		if (!graph.nodes.has(urlPage)) {
			setCurrentPage("__notfound__");
			setIsValidating(false);
			return;
		}

		// Validation passes - page is valid and state exists
		setCurrentPage(urlPage);
		setIsValidating(false);
	}, [isValidating, urlParams, pageParamName, graph, wizardUuid, stateManager]);

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

		// Check if UUID exists in session storage BEFORE doing anything
		const uuidExists = stateManager.hasState(wizardUuid);

		// Validate: UUID existence takes priority (only if not entry point)
		// For entry point, UUID doesn't need to exist (new wizard start)
		if (!uuidExists && urlPage && !isEntryPoint) {
			// UUID doesn't exist and not entry point - show expired (don't create state)
			// This takes priority over page existence check
			if (currentPage !== "__expired__") {
				setCurrentPage("__expired__");
			}
			return;
		}

		// UUID exists (or is entry point), now check if page exists in graph
		if (urlPage && !graph.nodes.has(urlPage)) {
			// UUID exists but page doesn't exist - show page not found (don't create state)
			if (currentPage !== "__notfound__") {
				setCurrentPage("__notfound__");
			}
			return;
		}

		// Validation passes - ensure currentPage matches URL page if it was set to error state initially
		// This handles the case where initial state validation didn't run properly
		if (
			(currentPage === "__expired__" || currentPage === "__notfound__") &&
			urlPage &&
			graph.nodes.has(urlPage)
		) {
			// Validation now passes, update to show the actual page
			setCurrentPage(urlPage);
		}

		// If we're already showing an error page but validation passes, don't proceed
		// This prevents flicker when initial state was set correctly
		if (currentPage === "__expired__" || currentPage === "__notfound__") {
			// If validation now passes, we should show the actual page
			// But only if the URL page matches what we expect
			if (
				urlPage &&
				urlPage !== currentPage &&
				graph.nodes.has(urlPage) &&
				uuidExists
			) {
				// Validation now passes, update to show the actual page
				setCurrentPage(urlPage);
			} else {
				// Still invalid, keep error state (already set correctly)
				return;
			}
		}

		// Only pre-register state if validation passes and we haven't initialized yet
		// Pre-register if UUID doesn't exist AND (this is the entry point OR no page param)
		// This ensures we only create state for valid new wizard starts
		if (
			!hasInitializedRef.current &&
			!uuidExists &&
			(isEntryPoint || !urlPage)
		) {
			stateManager.preRegisterState(graph, wizardUuid);
			hasInitializedRef.current = true;
			// Trigger a re-render after pre-registration to load any existing state
			setStateVersion((prev) => prev + 1);
		} else if (uuidExists) {
			// If UUID exists, mark as initialized (state was created in a previous session)
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
					onPageChange?.(targetPage, currentPage);
				}
			} else {
				// Normal navigation - page is not skipped, URL drives the state
				setCurrentPage(urlPage);
				onPageChange?.(urlPage, currentPage);
			}
		} else if (!urlPage) {
			// If URL has no page param, sync to entry point
			if (entryPoint && entryPoint !== currentPage) {
				setCurrentPage(entryPoint);
				urlParams.setParam(pageParamName, entryPoint);
			} else if (!entryPoint && currentPage) {
				// No entry point and no URL param, clear current page
				setCurrentPage(null);
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
		wizardUuid,
		isValidating,
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
				onPageChange?.(nextPage, currentPage);
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
		let directNext: string | null = null;
		if (currentNode) {
			const resolved = currentNode.next;
			if (typeof resolved === "string") {
				directNext = resolved;
			} else if (Array.isArray(resolved) && resolved.length > 0) {
				directNext = resolved[0];
			} else if (typeof resolved === "function") {
				const funcResult = resolved(allState);
				if (typeof funcResult === "string") {
					directNext = funcResult;
				} else if (Array.isArray(funcResult) && funcResult.length > 0) {
					directNext = funcResult[0];
				}
			}
		}

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
		onPageChange?.(nextPage, previousPage);
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
			onPageChange?.(page, previousPage);
		},
		[graph, currentPage, onPageChange, pageParamName, urlParams],
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
			onPageChange?.(nextPage, currentPage);
		}

		setIsCheckingSkip(false);
	}, [currentPage, graph, allState, pageParamName, urlParams, onPageChange]);

	// Complete wizard and clear state from session storage
	// User is responsible for handling navigation/redirect after calling this
	const completeWizard = useCallback(() => {
		stateManager.clearState(wizardUuid);
	}, [stateManager, wizardUuid]);

	// State update functions
	const updateState = useCallback(
		(key: string, value: unknown) => {
			if (!currentPage) {
				return;
			}
			stateManager.setState(wizardUuid, currentPage, key, value);
			// Trigger re-computation of allState
			setStateVersion((prev) => prev + 1);
		},
		[currentPage, stateManager, wizardUuid],
	);

	const updateStateBatch = useCallback(
		(updates: Record<string, unknown>) => {
			if (!currentPage) {
				return;
			}
			stateManager.setStateBatch(wizardUuid, currentPage, updates);
			// Trigger re-computation of allState
			setStateVersion((prev) => prev + 1);
		},
		[currentPage, stateManager, wizardUuid],
	);

	const getPageState = useCallback(
		(page: string) => {
			return stateManager.getState(wizardUuid, page);
		},
		[stateManager, wizardUuid],
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

	const hasPrevious = useCallback(() => {
		if (!currentPage) {
			return false;
		}
		// Check if there's browser history to go back to
		if (typeof window !== "undefined" && window.history.length > 1) {
			return true;
		}
		// Fallback to graph-based check
		return getPreviousPage(graph, currentPage, allState) !== null;
	}, [graph, currentPage, allState]);

	// Build context value
	const contextValue: WizardContextValue = useMemo(
		() => ({
			currentPage,
			state: allState,
			goToNext,
			goToPrevious,
			goToPage,
			updateState,
			updateStateBatch,
			getPageState,
			getCurrentNode,
			getNode: getNodeByPage,
			hasNext,
			hasPrevious,
			skipCurrentPage,
			completeWizard,
		}),
		[
			currentPage,
			allState,
			goToNext,
			goToPrevious,
			goToPage,
			updateState,
			updateStateBatch,
			getPageState,
			getCurrentNode,
			getNodeByPage,
			hasNext,
			hasPrevious,
			skipCurrentPage,
			completeWizard,
		],
	);

	const currentNode = getCurrentNode();

	// Don't render anything while validating initial state (entry point + session storage check)
	// This prevents flicker when navigating to a non-entry-point page without state
	if (isValidating) {
		return null;
	}

	// Show loader if we're checking if page should be skipped
	if (isCheckingSkip) {
		return (
			<WizardContext.Provider value={contextValue}>
				{loadingFallback || (
					<div className="flex items-center justify-center p-8">
						<div className="text-muted-foreground">Loading...</div>
					</div>
				)}
			</WizardContext.Provider>
		);
	}

	return (
		<WizardContext.Provider value={contextValue}>
			<Presenter
				page={currentPage}
				node={currentNode}
				componentLoaders={componentLoadersMap}
				loadingFallback={loadingFallback}
				unknownPageFallback={unknownPageFallback}
			/>
		</WizardContext.Provider>
	);
}
