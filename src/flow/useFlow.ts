"use client";

import { useCallback } from "react";
import { useFlowContext } from "@/flow/FlowContext";
import type { UseFlowReturn } from "@/flow/types";

/**
 * Single hook to access all flow functionality.
 * Use one import and destructure what you need.
 *
 * @example
 * const { goToNext, goToPrevious, goToPage, skipToPage, stateKey, currentPage, hasNext, hasPrevious } = useFlow();
 * const [name, setName] = stateKey("name");
 * // goToPage(page) — jump to any node, preserve history (push). skipToPage(page) — same, replace (no back).
 */
export function useFlow(): UseFlowReturn {
	const ctx = useFlowContext();

	const stateKey = useCallback(
		<T = unknown>(key: string) => {
			const value = (ctx.state[key] as T | undefined) ?? undefined;
			const setValue = (newValue: T) => ctx.updateState(key, newValue);
			return [value, setValue] as const;
		},
		[ctx.state, ctx.updateState],
	);

	return {
		...ctx,
		stateKey,
		hasNext: ctx.hasNext(),
		hasPrevious: ctx.hasPrevious(),
	};
}
