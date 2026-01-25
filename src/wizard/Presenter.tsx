"use client";

import { lazy, Suspense, useMemo } from "react";
import type { WizardNode } from "@/wizard/types";

const PageA = lazy(() => import("@/wizard/test/pages/PageA"));
const PageB = lazy(() => import("@/wizard/test/pages/PageB"));
const PageC = lazy(() => import("@/wizard/test/pages/PageC"));
const PageD = lazy(() => import("@/wizard/test/pages/PageD"));
const PageE = lazy(() => import("@/wizard/test/pages/PageE"));
const Expired = lazy(() => import("@/wizard/test/pages/Expired"));
const PageNotFound = lazy(() => import("@/wizard/test/pages/PageNotFound"));

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
 * Uses a switch statement to map page identifiers to components
 */
export function Presenter({
	page,
	node,
	loadingFallback = <DefaultLoadingFallback />,
	unknownPageFallback,
}: PresenterProps) {
	// Memoize the component selection to prevent remounting on every render
	const Component = useMemo(() => {
		if (!page) {
			return null;
		}

		switch (page) {
			case "pageA":
				return PageA;
			case "pageB":
				return PageB;
			case "pageC":
				return PageC;
			case "pageD":
				return PageD;
			case "pageE":
				return PageE;
			case "__expired__":
				return Expired;
			case "__notfound__":
				return PageNotFound;
			default:
				return null;
		}
	}, [page]);

	// Handle expired and not found states - don't require a node for these cases
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
