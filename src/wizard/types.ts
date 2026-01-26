/**
 * Component loader function for lazy loading page components
 */
export type ComponentLoader = () => Promise<{ default: React.ComponentType }>;

/**
 * Next page resolver - can be a string, array of strings, or a function
 */
export type NextPageResolver<TState = WizardState> =
	| string
	| string[]
	| ((state: TState) => string | string[] | null);

/**
 * Wizard node definition
 * @template TState - The type of state for this page (used to type the `nextPage` and `shouldSkip` functions)
 */
export type WizardNode<TState = WizardState> = {
	/**
	 * Unique identifier for this page/step
	 */
	currentPage: string;

	/**
	 * Determines the next page(s) to navigate to.
	 * Can be a string, array of strings, or a function that evaluates state.
	 * The state parameter is typed as TState.
	 */
	nextPage?: NextPageResolver<TState>;

	/**
	 * Optional previous page identifier. Used as fallback for hasPrevious and
	 * when resolving previous non-skipped pages. Back navigation uses browser
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
 * Accumulated wizard state from all steps
 */
export type WizardState = Record<string, unknown>;

/**
 * Graph structure storing all wizard nodes
 */
export type WizardGraph = {
	/**
	 * Map of page identifiers to their node definitions
	 */
	nodes: Map<string, WizardNode>;

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
 * Wizard context value provided to child components
 */
export type WizardContextValue = {
	/**
	 * Current page identifier
	 */
	currentPage: string | null;

	/**
	 * Current accumulated state from all steps
	 */
	state: WizardState;

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
	 * Uses replace instead of push, so back navigation won’t return to the page you left.
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
	 * Get state for a specific page
	 */
	getPageState: (page: string) => WizardState;

	/**
	 * Get the current node definition
	 */
	getCurrentNode: () => WizardNode | undefined;

	/**
	 * Get a node by page identifier
	 */
	getNode: (page: string) => WizardNode | undefined;

	/**
	 * Check if there is a next page available
	 */
	hasNext: () => boolean;

	/**
	 * Check if there is a previous page available
	 */
	hasPrevious: () => boolean;

	/**
	 * Skip the current page and navigate to the next non-skipped page
	 * This can be called from within a page component after loading
	 * to conditionally skip based on async checks (API calls, etc.)
	 */
	skipCurrentPage: () => void;

	/**
	 * Complete the wizard and clear state from session storage
	 * The user is responsible for handling navigation/redirect after calling this
	 */
	completeWizard: () => void;

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
 * Return type of useWizard().
 * Extends WizardContextValue with stateKey helper and hasNext/hasPrevious as booleans.
 */
export type UseWizardReturn = Omit<
	WizardContextValue,
	"hasNext" | "hasPrevious"
> & {
	/** Get [value, setValue] for a state key. Replaces useWizardState(key). */
	stateKey: <T = unknown>(
		key: string,
	) => readonly [T | undefined, (value: T) => void];
	/** Whether there is a next page (resolved boolean). */
	hasNext: boolean;
	/** Whether there is a previous page (resolved boolean). */
	hasPrevious: boolean;
};
