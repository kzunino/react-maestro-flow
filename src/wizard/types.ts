/**
 * JSON Schema type definition (plain object, no validation library)
 */
export type JSONSchema = Record<string, unknown>;

/**
 * Component loader function for lazy loading page components
 */
export type ComponentLoader = () => Promise<{ default: React.ComponentType }>;

/**
 * Next page resolver - can be a string, array of strings, or a function
 */
export type NextPageResolver =
	| string
	| string[]
	| ((state: WizardState) => string | string[] | null);

/**
 * Typed wizard node - includes TypeScript type information
 */
export type TypedWizardNode<TState = Record<string, unknown>> = {
	/**
	 * Unique identifier for this page/step
	 */
	page: string;

	/**
	 * Optional JSON Schema for UI configuration
	 */
	uiSchema?: JSONSchema;

	/**
	 * JSON Schema for form validation
	 */
	form: JSONSchema;

	/**
	 * JSON Schema defining the context/state shape for this step
	 */
	schemaContext: JSONSchema;

	/**
	 * TypeScript type for this page's state (inferred from schemaContext)
	 */
	__stateType?: TState;
};

/**
 * Wizard node definition
 */
export type WizardNode = {
	/**
	 * Unique identifier for this page/step
	 */
	page: string;

	/**
	 * Optional JSON Schema for UI configuration
	 */
	uiSchema?: JSONSchema;

	/**
	 * JSON Schema for form validation
	 */
	form: JSONSchema;

	/**
	 * JSON Schema defining the context/state shape for this step
	 */
	schemaContext: JSONSchema;

	/**
	 * Determines the next page(s) to navigate to
	 * Can be a string, array of strings, or a function that evaluates state
	 */
	next?: NextPageResolver;

	/**
	 * Optional previous page identifier for back navigation
	 */
	previous?: string;

	/**
	 * Optional function to determine if this step should be skipped
	 * Returns true if the step should be skipped based on current state
	 * Skipped steps are automatically bypassed and removed from browser history
	 */
	shouldSkip?: (state: WizardState) => boolean;
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
	 * Navigate to a specific page
	 */
	goToPage: (page: string) => void;

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
};
