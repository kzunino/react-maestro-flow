"use client";

import type { FlowContextValue } from "@/flow/types";
import { createContext, useContext } from "react";

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
