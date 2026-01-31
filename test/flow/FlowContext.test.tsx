import { FlowContext, useFlowContext } from "@/flow/FlowContext";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

function Consumer() {
	const ctx = useFlowContext();
	return <span data-testid="current">{ctx?.currentPage ?? "none"}</span>;
}

describe("FlowContext", () => {
	it("useFlowContext returns value from provider", () => {
		const mockValue = {
			currentPage: "testPage",
			state: {},
			goToNext: () => {},
			goToPrevious: () => {},
			goToPage: () => {},
			skipToPage: () => {},
			updateState: () => {},
			updateStateBatch: () => {},
			getPageState: () => ({}),
			getCurrentNode: () => undefined,
			getNode: () => undefined,
			hasNext: () => false,
			skipCurrentPage: () => {},
			completeFlow: () => {},
			getUrlParam: () => null,
			getAllUrlParams: () => ({}),
			urlParams: {},
		};

		render(
			<FlowContext.Provider value={mockValue}>
				<Consumer />
			</FlowContext.Provider>,
		);
		expect(screen.getByTestId("current")).toHaveTextContent("testPage");
	});

	it("useFlowContext throws outside provider", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() => render(<Consumer />)).toThrow(
			"useFlowContext must be used within a Flow component",
		);
		spy.mockRestore();
	});
});
