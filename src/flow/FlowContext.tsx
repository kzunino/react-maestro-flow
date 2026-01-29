"use client";

import { createContext, useContext } from "react";
import type { FlowContextValue } from "@/flow/types";

/**
 * React context for flow state and navigation
 */
export const FlowContext = createContext<FlowContextValue | null>(null);

/**
 * Hook to access flow context
 * Throws an error if used outside of Flow component
 */
export function useFlowContext(): FlowContextValue {
	const context = useContext(FlowContext);
	if (!context) {
		throw new Error("useFlowContext must be used within a Flow component");
	}
	return context;
}
