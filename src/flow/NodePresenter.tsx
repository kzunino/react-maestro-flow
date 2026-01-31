import type { ComponentLoader, FlowNode } from "@/flow/types";
import { Suspense, lazy, useMemo } from "react";

/**
 * Props for the Presenter component
 */
export type PresenterProps = {
	/**
	 * Current page identifier
	 */
	page: string | null;

	/**
	 * Current node definition
	 */
	node: FlowNode | undefined;

	/**
	 * Map of page identifiers to component loaders
	 * Each loader should return a promise that resolves to a component with a default export
	 */
	componentLoaders: Map<string, ComponentLoader>;
};

/**
 * Presenter component that dynamically loads and renders flow pages
 * Uses React.lazy for code splitting and tree shaking
 * Dynamically loads components based on the provided componentLoaders map
 * Components should handle their own loading states
 */
export function Presenter({ page, node, componentLoaders }: PresenterProps) {
	// Memoize the lazy-loaded component to prevent remounting on every render
	const Component = useMemo(() => {
		if (!page) {
			return null;
		}

		const loader = componentLoaders.get(page);
		if (!loader) {
			return null;
		}

		// Use React.lazy to wrap the loader function
		return lazy(loader);
	}, [page, componentLoaders]);

	// Handle special states (expired, not found) - don't require a node for these cases
	if (page === "__expired__" || page === "__notfound__") {
		if (!Component) {
			console.warn(
				`No component loader found for page "${page}". Add it to your componentLoaders map.`,
			);
			return null;
		}
		return (
			<Suspense fallback={null}>
				<Component />
			</Suspense>
		);
	}

	if (!page || !node) {
		return null;
	}

	if (!Component) {
		return null;
	}

	return (
		<Suspense fallback={null}>
			<Component />
		</Suspense>
	);
}
