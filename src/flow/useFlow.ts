"use client";

import { useFlowContext } from "@/flow/FlowContext";
import type { UseFlowReturn } from "@/flow/types";
import { useCallback } from "react";

/**
 * Single hook to access all flow functionality.
 * Use one import and destructure what you need.
 *
 * stateKey is page-scoped: each page has its own namespace. Keys like "name" or "email"
 * won't collide across pages. For cross-page data (e.g. routing), use `state` or
 * `getPageState(page)`.
 *
 * @example
 * const { goToNext, goToPrevious, goToPage, skipToPage, stateKey, currentPage, hasNext } = useFlow();
 * const [name, setName] = stateKey("name");  // Page-specific; no collision with other pages
 * // goToPage(page) — jump to any node, preserve history (push). skipToPage(page) — same, replace (no back).
 */
export function useFlow(): UseFlowReturn {
	const ctx = useFlowContext();

	const stateKey = useCallback(
		<T = unknown>(key: string) => {
			const pageState = ctx.currentPage
				? ctx.getPageState(ctx.currentPage)
				: {};
			const value = (pageState[key] as T | undefined) ?? undefined;
			const setValue = (newValue: T) => ctx.updateState(key, newValue);
			return [value, setValue] as const;
		},
		[ctx.currentPage, ctx.getPageState, ctx.updateState],
	);

	return {
		...ctx,
		stateKey,
		hasNext: ctx.hasNext(),
	};
}
