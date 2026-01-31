/**
 * Component loader function for lazy loading page components
 */
export type ComponentLoader = () => Promise<{ default: React.ComponentType }>;

/**
 * Next page resolver - can be a string or a function
 */
export type NextPageResolver<TState = FlowStateByPage> =
	| string
	| ((state: TState) => string | null);

/**
 * Flow node definition
 * @template TState - The type of state for this page (used to type the `nextPage` and `shouldSkip` functions)
 */
export type FlowNode<TState = FlowStateByPage> = {
	/**
	 * Unique identifier for this page/step
	 */
	currentPage: string;

	/**
	 * Determines the next page to navigate to.
	 * Can be a string or a function that evaluates state.
	 * The state parameter is typed as TState.
	 */
	nextPage?: NextPageResolver<TState>;

	/**
	 * Optional previous page identifier. Used when resolving previous non-skipped
	 * pages (e.g. skip chain). Back navigation uses browser
	 * history by default.
	 */
	previousPageFallback?: string;

	/**
	 * Optional function to determine if this step should be skipped
	 * Returns true if the step should be skipped based on current state
	 * Skipped steps are automatically bypassed and removed from browser history
	 * The state parameter is typed as TState
	 */
	shouldSkip?: (state: TState) => boolean;
};

/**
 * State for a single page
 */
export type FlowState = Record<string, unknown>;

/**
 * Accumulated state from all steps, keyed by page.
 * Each page has its own namespace, so the same key (e.g. "name") won't overwrite
 * across pages. Use state.pageA.name and state.pageC.name for different values.
 */
export type FlowStateByPage = Record<string, FlowState>;

/**
 * Graph structure storing all flow nodes
 */
export type FlowGraph = {
	/**
	 * Map of page identifiers to their node definitions
	 */
	nodes: Map<string, FlowNode>;

	/**
	 * Optional entry point (first page)
	 */
	entryPoint?: string;
};

/**
 * URL parameter adapter interface for framework-agnostic routing
 */
export type UrlParamsAdapter = {
	/**
	 * Get a single URL parameter value
	 */
	getParam: (key: string) => string | null;

	/**
	 * Set a URL parameter (updates URL, adds to history)
	 */
	setParam: (key: string, value: string) => void;

	/**
	 * Replace a URL parameter (updates URL, replaces current history entry)
	 */
	replaceParam: (key: string, value: string) => void;

	/**
	 * Get all URL parameters as an object
	 */
	getAllParams: () => Record<string, string>;

	/**
	 * Replace all URL parameters
	 */
	replaceParams: (params: Record<string, string>) => void;
};

/**
 * Flow context value provided to child components
 */
export type FlowContextValue = {
	/**
	 * Current page identifier
	 */
	currentPage: string | null;

	/**
	 * Accumulated state from all pages, keyed by page (e.g. state.pageA, state.pageB).
	 * Same keys on different pages don't overwrite. Used by nextPage/shouldSkip.
	 * For page-local data in components, use stateKey() or getPageState(page).
	 */
	state: FlowStateByPage;

	/**
	 * Navigate to the next page
	 */
	goToNext: () => void;

	/**
	 * Navigate to the previous page
	 */
	goToPrevious: () => void;

	/**
	 * Navigate to a specific page and preserve history.
	 * Pushes a new entry, so back navigation returns to the page you left.
	 * Use for normal "go to any node" navigation (e.g. after API) when you want
	 * the user to be able to go back.
	 */
	goToPage: (page: string) => void;

	/**
	 * Skip to a specific page without adding the current page to history.
	 * Uses replace instead of push, so back navigation won't return to the page you left.
	 * Use when jumping to a node based on async results (e.g. API response) rather than
	 * following the normal next/previous flow.
	 */
	skipToPage: (page: string) => void;

	/**
	 * Update state for the current step
	 */
	updateState: (key: string, value: unknown) => void;

	/**
	 * Update multiple state values at once
	 */
	updateStateBatch: (updates: Record<string, unknown>) => void;

	/**
	 * Get state for a specific page (page-scoped, no merge).
	 * Use this when you need another page's data or to avoid key collisions.
	 */
	getPageState: (page: string) => FlowState;

	/**
	 * Get the current node definition
	 */
	getCurrentNode: () => FlowNode | undefined;

	/**
	 * Get a node by page identifier
	 */
	getNode: (page: string) => FlowNode | undefined;

	/**
	 * Check if there is a next page available
	 */
	hasNext: () => boolean;

	/**
	 * Skip the current page and navigate to the next non-skipped page
	 * This can be called from within a page component after loading
	 * to conditionally skip based on async checks (API calls, etc.)
	 */
	skipCurrentPage: () => void;

	/**
	 * Complete the flow and clear state from session storage
	 * The user is responsible for handling navigation/redirect after calling this
	 */
	completeFlow: () => void;

	/**
	 * Get a single URL parameter (query or path, depending on adapter).
	 * Use this to read arbitrary params like id, type, someOtherOptions, etc.
	 */
	getUrlParam: (key: string) => string | null;

	/**
	 * Get all URL parameters as a record.
	 */
	getAllUrlParams: () => Record<string, string>;

	/**
	 * Reactive snapshot of all URL params (updates on navigation).
	 */
	urlParams: Record<string, string>;
};

/**
 * Return type of useFlow().
 * Extends FlowContextValue with stateKey helper and hasNext as boolean.
 */
export type UseFlowReturn = Omit<FlowContextValue, "hasNext"> & {
	/** Get [value, setValue] for a state key. Page-scoped: each page has its own namespace, so keys like "name" or "email" won't collide across pages. */
	stateKey: <T = unknown>(
		key: string,
	) => readonly [T | undefined, (value: T) => void];
	/** Whether there is a next page (resolved boolean). */
	hasNext: boolean;
};
