import * as react_jsx_runtime from 'react/jsx-runtime';
import * as react from 'react';

/**
 * Component loader function for lazy loading page components
 */
type ComponentLoader = () => Promise<{
    default: React.ComponentType;
}>;
/**
 * Next page resolver - can be a string or a function
 */
type NextPageResolver<TState = WizardState> = string | ((state: TState) => string | null);
/**
 * Wizard node definition
 * @template TState - The type of state for this page (used to type the `nextPage` and `shouldSkip` functions)
 */
type WizardNode<TState = WizardState> = {
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
type WizardState = Record<string, unknown>;
/**
 * Graph structure storing all wizard nodes
 */
type WizardGraph = {
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
type UrlParamsAdapter = {
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
type WizardContextValue = {
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
     * Complete the wizard and clear state from session storage and URL params.
     * Clears the wizard's state data and removes page/id params from the URL.
     * The user is responsible for handling navigation/redirect after calling this.
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
type UseWizardReturn = Omit<WizardContextValue, "hasNext" | "hasPrevious"> & {
    /** Get [value, setValue] for a state key. Replaces useWizardState(key). */
    stateKey: <T = unknown>(key: string) => readonly [T | undefined, (value: T) => void];
    /** Whether there is a next page (resolved boolean). */
    hasNext: boolean;
    /** Whether there is a previous page (resolved boolean). */
    hasPrevious: boolean;
};

/**
 * Creates a new empty wizard graph
 */
declare function createWizardGraph(): WizardGraph;
/**
 * Registers a node in the wizard graph
 */
declare function registerNode(graph: WizardGraph, node: WizardNode): void;
/**
 * Creates a wizard graph from an array of nodes
 * This is a convenience function for defining complete wizards in one place
 */
declare function createWizardGraphFromNodes(nodes: WizardNode[], entryPoint?: string): WizardGraph;
/**
 * Gets a node by its page identifier
 */
declare function getNode(graph: WizardGraph, page: string): WizardNode | undefined;
/**
 * Checks if a step should be skipped based on its shouldSkip function and current state
 */
declare function shouldSkipStep(graph: WizardGraph, page: string, state: WizardState): boolean;
/**
 * Resolves the next page for a given node based on current state
 */
declare function resolveNextPage(node: WizardNode, state: WizardState): string | null;
/**
 * Recursively finds the next non-skipped page, preventing infinite loops
 */
declare function getNextNonSkippedPage(graph: WizardGraph, page: string, state: WizardState, visited?: Set<string>): string | null;
/**
 * Gets the next page for navigation (returns first page if multiple)
 * Automatically skips steps that should be skipped
 */
declare function getNextPage(graph: WizardGraph, currentPage: string, state: WizardState): string | null;
/**
 * Gets the next page (returns as array for consistency with previous API)
 * @deprecated Consider using getNextPage instead
 */
declare function getAllNextPages(graph: WizardGraph, currentPage: string, state: WizardState): string[];
/**
 * Recursively finds the previous non-skipped page, preventing infinite loops
 */
declare function getPreviousNonSkippedPage(graph: WizardGraph, page: string, state: WizardState, visited?: Set<string>): string | null;
/**
 * Gets the previous page for a given node
 * Automatically skips over steps that should be skipped
 */
declare function getPreviousPage(graph: WizardGraph, currentPage: string, state: WizardState): string | null;
/**
 * Validates that all referenced pages in the graph exist
 */
declare function validateGraph(graph: WizardGraph): {
    valid: boolean;
    errors: string[];
};
/**
 * Gets all pages in the graph in topological order (if possible)
 * Falls back to registration order if cycles exist
 */
declare function getPagesInOrder(graph: WizardGraph): string[];

/**
 * Single hook to access all wizard functionality.
 * Use one import and destructure what you need.
 *
 * @example
 * const { goToNext, goToPrevious, goToPage, skipToPage, stateKey, currentPage, hasNext, hasPrevious } = useWizard();
 * const [name, setName] = stateKey("name");
 * // goToPage(page) — jump to any node, preserve history (push). skipToPage(page) — same, replace (no back).
 */
declare function useWizard(): UseWizardReturn;

/**
 * Props for the Presenter component
 */
type PresenterProps = {
    /**
     * Current page identifier
     */
    page: string | null;
    /**
     * Current node definition
     */
    node: WizardNode | undefined;
    /**
     * Map of page identifiers to component loaders
     * Each loader should return a promise that resolves to a component with a default export
     */
    componentLoaders: Map<string, ComponentLoader>;
};
/**
 * Presenter component that dynamically loads and renders wizard pages
 * Uses React.lazy for code splitting and tree shaking
 * Dynamically loads components based on the provided componentLoaders map
 * Components should handle their own loading states
 */
declare function Presenter({ page, node, componentLoaders }: PresenterProps): react_jsx_runtime.JSX.Element | null;

/**
 * Configuration for path-based URL parameters
 * Defines the structure of the URL path with named segments
 *
 * Example: "/[id]/page/[page]" would match "/abc123/page/pageA"
 * and extract { id: "abc123", page: "pageA" }
 */
type PathConfig = {
    /**
     * Path template with named segments in brackets
     * Example: "/[id]/page/[page]" or "/wizard/[id]/[page]"
     */
    template: string;
    /**
     * Base path to prepend to the template (optional)
     * Example: "/wizard" would make the full path "/wizard/[id]/page/[page]"
     */
    basePath?: string;
};
/**
 * Creates a path-based URL params adapter
 * This adapter uses URL path segments instead of query parameters
 *
 * @param config - Path configuration defining the URL structure
 * @returns A UrlParamsAdapter that works with path segments
 *
 * @example
 * ```ts
 * const adapter = createPathParamsAdapter({
 *   template: "/[id]/page/[page]"
 * });
 * // URLs will be like: /abc123/page/pageA
 * ```
 */
declare function createPathParamsAdapter(config: PathConfig): UrlParamsAdapter;
/**
 * Framework-agnostic path params adapter that reads initial params from props
 * Works with any framework that provides route params (Next.js, Remix, etc.)
 * Uses browser History API for navigation, making it framework-agnostic
 *
 * @param pathParams - Route params from your framework (can be a Promise in Next.js 15+)
 * @param config - Path configuration
 * @returns A UrlParamsAdapter that works with path segments
 *
 * @example
 * ```tsx
 * // Next.js example
 * export default function WizardPage({ params }: { params: Promise<{ id: string; page: string }> }) {
 *   const resolvedParams = use(params);
 *   const adapter = createPathParamsAdapterFromProps(
 *     resolvedParams,
 *     { template: "/[id]/[page]", basePath: "/wizard" }
 *   );
 *   return <Wizard graph={graph} config={{ urlParamsAdapter: adapter }} />;
 * }
 *
 * // Other frameworks (Remix, etc.)
 * export default function WizardPage({ params }: { params: { id: string; page: string } }) {
 *   const adapter = createPathParamsAdapterFromProps(
 *     params,
 *     { template: "/[id]/[page]", basePath: "/wizard" }
 *   );
 *   return <Wizard graph={graph} config={{ urlParamsAdapter: adapter }} />;
 * }
 * ```
 */
declare function createPathParamsAdapterFromProps(_pathParams: Record<string, string | string[]> | Promise<Record<string, string | string[]>>, config: PathConfig): UrlParamsAdapter;

/**
 * Hook for managing URL parameters in a framework-agnostic way
 */
declare function useUrlParams(adapter?: UrlParamsAdapter): {
    getParam: (key: string) => string | null;
    setParam: (key: string, value: string) => void;
    replaceParam: (key: string, value: string) => void;
    getAllParams: () => Record<string, string>;
    replaceParams: (newParams: Record<string, string>) => void;
    params: Record<string, string>;
};

/**
 * Configuration options for the Wizard component
 */
type WizardConfig = {
    /**
     * Optional URL params adapter (defaults to browser query params implementation).
     *
     * Controls how the wizard reads/writes URL parameters (page, id, etc.).
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
     * <Wizard graph={graph} /> // URLs: ?page=pageA&id=xyz
     *
     * // Path-based URLs
     * const adapter = createPathParamsAdapter({ template: "/[id]/page/[page]" });
     * <Wizard graph={graph} config={{ urlParamsAdapter: adapter }} />
     * // URLs: /test123/page/pageA
     * ```
     */
    urlParamsAdapter?: UrlParamsAdapter;
    /**
     * Optional URL parameter name for the current page (defaults to "page")
     */
    pageParamName?: string;
    /**
     * Optional URL parameter name for the wizard UUID (defaults to "id")
     */
    uuidParamName?: string;
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
type WizardProps = {
    /**
     * The wizard graph definition (nodes contain component loaders)
     */
    graph: WizardGraph;
    /**
     * Optional configuration object
     */
    config?: WizardConfig;
};
declare function Wizard({ graph, config }: WizardProps): react_jsx_runtime.JSX.Element | null;

/**
 * React context for wizard state and navigation
 */
declare const WizardContext: react.Context<WizardContextValue | null>;
/**
 * Hook to access wizard context
 * Throws an error if used outside of Wizard component
 */
declare function useWizardContext(): WizardContextValue;

export { type NextPageResolver, type PathConfig, Presenter, type PresenterProps, type UrlParamsAdapter, type UseWizardReturn, Wizard, type WizardConfig, WizardContext, type WizardContextValue, type WizardGraph, type WizardNode, type WizardProps, type WizardState, createPathParamsAdapter, createPathParamsAdapterFromProps, createWizardGraph, createWizardGraphFromNodes, getAllNextPages, getNextNonSkippedPage, getNextPage, getNode, getPagesInOrder, getPreviousNonSkippedPage, getPreviousPage, registerNode, resolveNextPage, shouldSkipStep, useUrlParams, useWizard, useWizardContext, validateGraph };
