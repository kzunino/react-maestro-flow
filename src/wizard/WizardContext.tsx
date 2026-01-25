"use client";

import { createContext, useContext } from "react";
import type { WizardContextValue } from "@/wizard/types";

/**
 * React context for wizard state and navigation
 */
export const WizardContext = createContext<WizardContextValue | null>(null);

/**
 * Hook to access wizard context
 * Throws an error if used outside of Wizard component
 */
export function useWizardContext(): WizardContextValue {
	const context = useContext(WizardContext);
	if (!context) {
		throw new Error("useWizardContext must be used within a Wizard component");
	}
	return context;
}
