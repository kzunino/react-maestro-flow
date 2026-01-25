"use client";

import { useCallback } from "react";
import type { WizardState } from "@/wizard/types";
import { useWizardContext } from "@/wizard/WizardContext";

/**
 * Hook to access the wizard context
 * Provides all wizard functionality to child components
 */
export function useWizard() {
	return useWizardContext();
}

/**
 * Hook to get and update state for the current wizard step
 */
export function useWizardState<T = unknown>(key: string) {
	const { state, updateState } = useWizardContext();

	const value = (state[key] as T | undefined) ?? undefined;

	const setValue = useCallback(
		(newValue: T) => {
			updateState(key, newValue);
		},
		[key, updateState],
	);

	return [value, setValue] as const;
}

/**
 * Hook to get and update all state for the current wizard step
 * Returns the entire page state object with proper typing
 */
export function useWizardPageState<
	T extends Record<string, unknown> = Record<string, unknown>,
>() {
	const { state, updateStateBatch } = useWizardContext();

	// Get state for current page only (filtered by current page's state keys)
	// This is a simplified version - in practice, you'd want to get the actual page state
	const pageState = (state as T) || ({} as T);

	const setPageState = useCallback(
		(updates: Partial<T>) => {
			updateStateBatch(updates);
		},
		[updateStateBatch],
	);

	return [pageState, setPageState] as const;
}

/**
 * Hook to get multiple state values at once
 */
export function useWizardStateBatch(keys: string[]) {
	const { state, updateStateBatch } = useWizardContext();

	const values = useCallback(() => {
		const result: Record<string, unknown> = {};
		for (const key of keys) {
			result[key] = state[key];
		}
		return result;
	}, [keys, state]);

	const setValues = useCallback(
		(updates: Record<string, unknown>) => {
			updateStateBatch(updates);
		},
		[updateStateBatch],
	);

	return [values, setValues] as const;
}

/**
 * Hook for wizard navigation helpers
 */
export function useWizardNavigation() {
	const {
		goToNext,
		goToPrevious,
		goToPage,
		hasNext,
		hasPrevious,
		currentPage,
	} = useWizardContext();

	return {
		goToNext,
		goToPrevious,
		goToPage,
		hasNext: hasNext(),
		hasPrevious: hasPrevious(),
		currentPage,
	};
}

/**
 * Hook to get state for a specific page (not just current)
 * @deprecated Use useWizardPageState() for current page or getPageState() directly
 */
export function useWizardPageStateByPage(page: string): WizardState {
	const { getPageState } = useWizardContext();
	return getPageState(page);
}

/**
 * Hook to get the current node definition
 */
export function useWizardCurrentNode() {
	const { getCurrentNode } = useWizardContext();
	return getCurrentNode();
}

/**
 * Hook to get a node by page identifier
 */
export function useWizardNode(page: string) {
	const { getNode } = useWizardContext();
	return getNode(page);
}

/**
 * Hook to skip the current page and navigate to the next non-skipped page
 * This is useful for conditional skipping based on async checks (API calls, etc.)
 * Call this from within a page component after determining the page should be skipped
 */
export function useWizardSkip() {
	const { skipCurrentPage } = useWizardContext();
	return skipCurrentPage;
}
