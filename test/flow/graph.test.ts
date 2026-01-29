import { describe, expect, it } from "vitest";
import {
	getNextPage,
	getNextNonSkippedPage,
	getNode,
	getPagesInOrder,
	getPreviousPage,
	initializeFlow,
	registerNode,
	resolveNextPage,
	shouldSkipStep,
	validateGraph,
} from "@/flow/graphHelpers";

describe("graphHelpers", () => {
	it("initializeFlow creates graph from nodes and sets entry point", () => {
		const graph = initializeFlow(
			[
				{ currentPage: "a", nextPage: "b" },
				{ currentPage: "b", nextPage: "c" },
				{ currentPage: "c" },
			],
			"b",
		);
		expect(graph.entryPoint).toBe("b");
		expect(graph.nodes.size).toBe(3);
		expect(getNode(graph, "a")).toEqual({ currentPage: "a", nextPage: "b" });
		expect(getNode(graph, "c")).toEqual({ currentPage: "c" });
	});

	it("resolveNextPage returns string nextPage", () => {
		const node = { currentPage: "a", nextPage: "b" as const };
		expect(resolveNextPage(node, {})).toBe("b");
	});

	it("resolveNextPage evaluates function nextPage with state", () => {
		const node = {
			currentPage: "a",
			nextPage: (state: Record<string, unknown>) =>
				state.x === "y" ? "b" : "c",
		};
		expect(resolveNextPage(node, { x: "y" })).toBe("b");
		expect(resolveNextPage(node, { x: "z" })).toBe("c");
	});

	it("validateGraph reports invalid entry point", () => {
		const graph = initializeFlow([{ currentPage: "a" }], "a");
		(graph as { entryPoint?: string }).entryPoint = "missing";
		const result = validateGraph(graph);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("Entry point"))).toBe(true);
	});

	it("registerNode throws when currentPage already exists", () => {
		const graph = initializeFlow([{ currentPage: "a", nextPage: "b" }]);
		expect(() =>
			registerNode(graph, { currentPage: "a", nextPage: "c" }),
		).toThrow(/already exists in graph/);
	});

	it("getNextPage returns next page and follows skip chain", () => {
		const graph = initializeFlow(
			[
				{ currentPage: "a", nextPage: "b" },
				{
					currentPage: "b",
					nextPage: "c",
					shouldSkip: (s: Record<string, unknown>) => s.skipB === true,
				},
				{ currentPage: "c" },
			],
			"a",
		);
		expect(getNextPage(graph, "a", {})).toBe("b");
		expect(getNextPage(graph, "a", { skipB: true })).toBe("c");
	});

	it("getPreviousPage returns previousPageFallback and follows skip chain", () => {
		const graph = initializeFlow(
			[
				{ currentPage: "a" },
				{
					currentPage: "b",
					previousPageFallback: "a",
					nextPage: "c",
					shouldSkip: (s: Record<string, unknown>) => s.skipB === true,
				},
				{ currentPage: "c", previousPageFallback: "b" },
			],
			"a",
		);
		expect(getPreviousPage(graph, "c", {})).toBe("b");
		expect(getPreviousPage(graph, "c", { skipB: true })).toBe("a");
	});

	it("shouldSkipStep returns true when node.shouldSkip returns true", () => {
		const graph = initializeFlow([
			{
				currentPage: "a",
				nextPage: "b",
				shouldSkip: (s: Record<string, unknown>) => s.skip === true,
			},
			{ currentPage: "b" },
		]);
		expect(shouldSkipStep(graph, "a", {})).toBe(false);
		expect(shouldSkipStep(graph, "a", { skip: true })).toBe(true);
	});

	it("getPagesInOrder returns pages from entry point", () => {
		const graph = initializeFlow(
			[
				{ currentPage: "a", nextPage: "b" },
				{ currentPage: "b", nextPage: "c" },
				{ currentPage: "c" },
			],
			"a",
		);
		expect(getPagesInOrder(graph)).toEqual(["a", "b", "c"]);
	});

	it("getNextNonSkippedPage returns current page when not skipped", () => {
		const graph = initializeFlow([
			{ currentPage: "a", nextPage: "b" },
			{ currentPage: "b" },
		]);
		expect(getNextNonSkippedPage(graph, "b", {})).toBe("b");
	});
});
