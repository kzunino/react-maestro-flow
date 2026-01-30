import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FlowContext } from "@/flow/FlowContext";
import { useFlow } from "@/flow/useFlow";

function Consumer() {
	const { stateKey, hasNext, currentPage } = useFlow();
	const [name, setName] = stateKey<string>("name");
	return (
		<div data-testid="consumer">
			<span data-testid="page">{currentPage ?? "none"}</span>
			<span data-testid="name">{String(name ?? "")}</span>
			<span data-testid="hasNext">{String(hasNext)}</span>
			<button
				type="button"
				onClick={() => setName("Alice")}
				data-testid="setName"
			>
				Set name
			</button>
		</div>
	);
}

describe("useFlow", () => {
	afterEach(() => {
		cleanup();
	});

	const mockValue = {
		currentPage: "step1",
		state: { name: "Bob" },
		goToNext: () => {},
		goToPrevious: () => {},
		goToPage: () => {},
		skipToPage: () => {},
		updateState: (key: string, value: unknown) => {},
		updateStateBatch: () => {},
		getPageState: (page: string) =>
			page === "step1" ? { name: "Bob" } : {},
		getCurrentNode: () => undefined,
		getNode: () => undefined,
		hasNext: () => true,
		skipCurrentPage: () => {},
		completeFlow: () => {},
		getUrlParam: () => null,
		getAllUrlParams: () => ({}),
		urlParams: {},
	};

	it("returns currentPage and state from context", () => {
		render(
			<FlowContext.Provider value={mockValue}>
				<Consumer />
			</FlowContext.Provider>,
		);
		const scope = within(screen.getAllByTestId("consumer")[0]);
		expect(scope.getByTestId("page")).toHaveTextContent("step1");
		expect(scope.getByTestId("name")).toHaveTextContent("Bob");
	});

	it("exposes hasNext as boolean", () => {
		render(
			<FlowContext.Provider value={mockValue}>
				<Consumer />
			</FlowContext.Provider>,
		);
		const scope = within(screen.getAllByTestId("consumer")[0]);
		expect(scope.getByTestId("hasNext")).toHaveTextContent("true");
	});

	it("stateKey returns [value, setValue] and setValue calls updateState", () => {
		const updateState = vi.fn();
		render(
			<FlowContext.Provider value={{ ...mockValue, updateState }}>
				<Consumer />
			</FlowContext.Provider>,
		);
		within(screen.getAllByTestId("consumer")[0]).getByTestId("setName").click();
		expect(updateState).toHaveBeenCalledWith("name", "Alice");
	});
});
