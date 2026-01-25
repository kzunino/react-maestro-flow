import { lazy, Suspense, useMemo } from "react";
import type { ComponentLoader, WizardNode } from "@/wizard/types";

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
 * Default loading fallback
 */
const DefaultLoadingFallback = () => (
	<div className="flex items-center justify-center p-8">
		<div className="text-muted-foreground">Loading...</div>
	</div>
);

/**
 * Presenter component that dynamically loads and renders wizard pages
 * Uses React.lazy for code splitting and tree shaking
 * Dynamically loads components based on the provided componentLoaders map
 */
export function Presenter({
	page,
	node,
	componentLoaders,
	loadingFallback = <DefaultLoadingFallback />,
	unknownPageFallback,
}: PresenterProps) {
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
			return null;
		}
		return (
			<Suspense fallback={loadingFallback}>
				<Component />
			</Suspense>
		);
	}

	if (!page || !node) {
		return null;
	}

	if (!Component) {
		if (unknownPageFallback) {
			return <>{unknownPageFallback}</>;
		}
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-destructive">Unknown page: {page}</div>
			</div>
		);
	}

	return (
		<Suspense fallback={loadingFallback}>
			<Component />
		</Suspense>
	);
}
