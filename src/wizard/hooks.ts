"use client";

import { useCallback } from "react";
import type { UseWizardReturn } from "@/wizard/types";
import { useWizardContext } from "@/wizard/WizardContext";

/**
 * Single hook to access all wizard functionality.
 * Use one import and destructure what you need.
 *
 * @example
 * const { goToNext, goToPrevious, stateKey, currentPage, hasNext, hasPrevious } = useWizard();
 * const [name, setName] = stateKey("name");
 * const [email, setEmail] = stateKey("email");
 */
export function useWizard(): UseWizardReturn {
	const ctx = useWizardContext();

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
