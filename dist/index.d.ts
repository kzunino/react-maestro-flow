import * as react_jsx_runtime from 'react/jsx-runtime';
import * as react from 'react';

/**
 * JSON Schema type definition (plain object, no validation library)
 */
type JSONSchema = Record<string, unknown>;
/**
 * Component loader function for lazy loading page components
 */
type ComponentLoader = () => Promise<{
    default: React.ComponentType;
}>;
/**
 * Next page resolver - can be a string, array of strings, or a function
 */
type NextPageResolver = string | string[] | ((state: WizardState) => string | string[] | null);
/**
 * Wizard node definition
 */
type WizardNode = {
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
 * Resolves the next page(s) for a given node based on current state
 */
declare function resolveNextPage(node: WizardNode, state: WizardState): string | string[] | null;
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
 * Gets all possible next pages (useful for conditional branching)
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
 * Hook to access the wizard context
 * Provides all wizard functionality to child components
 */
declare function useWizard(): WizardContextValue;
/**
 * Hook to get and update state for the current wizard step
 */
declare function useWizardState<T = unknown>(key: string): readonly [NonNullable<T> | undefined, (newValue: T) => void];
/**
 * Hook to get and update all state for the current wizard step
 * Returns the entire page state object with proper typing
 */
declare function useWizardPageState<T extends Record<string, unknown> = Record<string, unknown>>(): readonly [T, (updates: Partial<T>) => void];
/**
 * Hook to get multiple state values at once
 */
declare function useWizardStateBatch(keys: string[]): readonly [() => Record<string, unknown>, (updates: Record<string, unknown>) => void];
/**
 * Hook for wizard navigation helpers
 */
declare function useWizardNavigation(): {
    goToNext: () => void;
    goToPrevious: () => void;
    goToPage: (page: string) => void;
    hasNext: boolean;
    hasPrevious: boolean;
    currentPage: string | null;
};
/**
 * Hook to get state for a specific page (not just current)
 * @deprecated Use useWizardPageState() for current page or getPageState() directly
 */
declare function useWizardPageStateByPage(page: string): WizardState;
/**
 * Hook to get the current node definition
 */
declare function useWizardCurrentNode(): WizardNode | undefined;
/**
 * Hook to get a node by page identifier
 */
declare function useWizardNode(page: string): WizardNode | undefined;
/**
 * Hook to skip the current page and navigate to the next non-skipped page
 * This is useful for conditional skipping based on async checks (API calls, etc.)
 * Call this from within a page component after determining the page should be skipped
 */
declare function useWizardSkip(): () => void;

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
    /**
     * Optional fallback component to show while loading
     */
    loadingFallback?: React.ReactNode;
    /**
     * Optional fallback component to show for unknown pages
     */
    unknownPageFallback?: React.ReactNode;
};
/**
 * Presenter component that dynamically loads and renders wizard pages
 * Uses React.lazy for code splitting and tree shaking
 * Dynamically loads components based on the provided componentLoaders map
 */
declare function Presenter({ page, node, componentLoaders, loadingFallback, unknownPageFallback, }: PresenterProps): react_jsx_runtime.JSX.Element | null;

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
 * Type helpers for converting JSON Schema to TypeScript types
 */
/**
 * JSON Schema property definition
 */
type JSONSchemaProperty = {
    type?: string;
    enum?: readonly unknown[];
    items?: JSONSchemaProperty;
    properties?: Record<string, JSONSchemaProperty>;
    required?: string[];
};
/**
 * Converts a JSON Schema type string to a TypeScript type
 */
type SchemaTypeToTS<T extends string | undefined> = T extends "string" ? string : T extends "number" ? number : T extends "integer" ? number : T extends "boolean" ? boolean : T extends "array" ? unknown[] : T extends "object" ? Record<string, unknown> : unknown;
/**
 * Extracts TypeScript type from a JSON Schema property
 */
type ExtractTypeFromSchema<T extends JSONSchemaProperty> = "enum" extends keyof T ? T["enum"] extends readonly (infer E)[] ? E : unknown : "type" extends keyof T ? T["type"] extends string ? SchemaTypeToTS<T["type"]> : unknown : "items" extends keyof T ? T["items"] extends JSONSchemaProperty ? ExtractTypeFromSchema<T["items"]>[] : unknown[] : unknown;
/**
 * Extracts TypeScript types from a JSON Schema object
 */
type SchemaToType<T extends {
    type: "object";
    properties?: Record<string, JSONSchemaProperty>;
}> = T["properties"] extends Record<string, JSONSchemaProperty> ? {
    [K in keyof T["properties"]]: ExtractTypeFromSchema<T["properties"][K]>;
} : Record<string, unknown>;
/**
 * Helper to define a typed schema for a wizard page
 * This ensures the schemaContext matches the TypeScript type
 */
declare function definePageSchema<T extends {
    type: "object";
    properties: Record<string, JSONSchemaProperty>;
}>(schema: T): T & {
    __type: SchemaToType<T>;
};
/**
 * Type helper to extract the state type from a schema
 */
type PageStateType<T extends {
    __type: unknown;
}> = T["__type"];

/**
 * Manager for wizard state stored in session storage
 * Uses UUID-based storage with array structure: wizard:{uuid}: [{ page, state }, ...]
 */
declare class WizardStateManager {
    private prefix;
    constructor(prefix?: string);
    /**
     * Gets the storage key for a wizard UUID
     */
    private getStorageKey;
    /**
     * Gets all page state entries for a wizard UUID
     */
    private getPageStateEntries;
    /**
     * Saves all page state entries for a wizard UUID
     */
    private setPageStateEntries;
    /**
     * Pre-registers all expected state keys from the graph
     * This allows us to see all expected state upfront
     */
    preRegisterState(graph: WizardGraph, uuid: string): void;
    /**
     * Gets state for a specific page
     */
    getState(uuid: string, page: string): WizardState;
    /**
     * Sets state for a specific page
     */
    setState(uuid: string, page: string, key: string, value: unknown): void;
    /**
     * Sets multiple state values for a page at once
     */
    setStateBatch(uuid: string, page: string, updates: Record<string, unknown>): void;
    /**
     * Gets accumulated state from all pages in the graph
     */
    getAllState(_graph: WizardGraph, uuid: string): WizardState;
    /**
     * Gets state for all pages up to and including the specified page
     */
    getStateUpTo(_graph: WizardGraph, uuid: string, page: string): WizardState;
    /**
     * Checks if state exists for a specific UUID
     */
    hasState(uuid: string): boolean;
    /**
     * Clears all wizard state for a specific UUID
     */
    clearState(uuid: string): void;
    /**
     * Clears state for a specific page within a wizard UUID
     */
    clearPageState(uuid: string, page: string): void;
}
/**
 * Default instance of WizardStateManager
 */
declare const defaultStateManager: WizardStateManager;

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

export { type JSONSchema, type NextPageResolver, type PageStateType, type PathConfig, Presenter, type PresenterProps, type SchemaToType, type UrlParamsAdapter, Wizard, type WizardConfig, WizardContext, type WizardContextValue, type WizardGraph, type WizardNode, type WizardProps, type WizardState, WizardStateManager, createPathParamsAdapter, createPathParamsAdapterFromProps, createWizardGraph, createWizardGraphFromNodes, defaultStateManager, definePageSchema, getAllNextPages, getNextNonSkippedPage, getNextPage, getNode, getPagesInOrder, getPreviousNonSkippedPage, getPreviousPage, registerNode, resolveNextPage, shouldSkipStep, useUrlParams, useWizard, useWizardContext, useWizardCurrentNode, useWizardNavigation, useWizardNode, useWizardPageState, useWizardPageStateByPage, useWizardSkip, useWizardState, useWizardStateBatch, validateGraph };
