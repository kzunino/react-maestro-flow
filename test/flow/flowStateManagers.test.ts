import { WizardStateManager } from "@/flow/flowStateManagers";
import { initializeFlow } from "@/flow/graphHelpers";
import { describe, expect, it } from "vitest";

describe("flowStateManagers", () => {
	const graph = initializeFlow(
		[
			{ currentPage: "a", nextPage: "b" },
			{ currentPage: "b", nextPage: "c" },
			{ currentPage: "c" },
		],
		"a",
	);

	it("hasState returns false when no state stored", () => {
		const manager = new WizardStateManager("flow-test:");
		expect(manager.hasState("uuid-123")).toBe(false);
	});

	it("setState and getState round-trip", () => {
		const manager = new WizardStateManager("flow-test:");
		manager.setState("uuid-456", "a", "name", "Alice");
		expect(manager.getState("uuid-456", "a")).toEqual({ name: "Alice" });
	});

	it("setStateBatch merges multiple keys", () => {
		const manager = new WizardStateManager("flow-test:");
		manager.setStateBatch("uuid-789", "b", { x: 1, y: 2 });
		expect(manager.getState("uuid-789", "b")).toEqual({ x: 1, y: 2 });
	});

	it("getAllState returns state keyed by page (no overwrite)", () => {
		const manager = new WizardStateManager("flow-test:");
		manager.setState("uuid-all", "a", "foo", "A");
		manager.setState("uuid-all", "b", "bar", "B");
		expect(manager.getAllState(graph, "uuid-all")).toEqual({
			a: { foo: "A" },
			b: { bar: "B" },
		});
	});

	it("getStateUpTo returns state keyed by page up to given page", () => {
		const manager = new WizardStateManager("flow-test:");
		manager.setState("uuid-upto", "a", "x", 1);
		manager.setState("uuid-upto", "b", "y", 2);
		manager.setState("uuid-upto", "c", "z", 3);
		expect(manager.getStateUpTo(graph, "uuid-upto", "b")).toEqual({
			a: { x: 1 },
			b: { y: 2 },
		});
	});

	it("clearState removes all state for uuid", () => {
		const manager = new WizardStateManager("flow-test:");
		manager.setState("uuid-clear", "a", "k", "v");
		expect(manager.hasState("uuid-clear")).toBe(true);
		manager.clearState("uuid-clear");
		expect(manager.hasState("uuid-clear")).toBe(false);
		expect(manager.getState("uuid-clear", "a")).toEqual({});
	});

	it("clearPageState removes only that page", () => {
		const manager = new WizardStateManager("flow-test:");
		manager.setState("uuid-page", "a", "a1", 1);
		manager.setState("uuid-page", "b", "b1", 2);
		manager.clearPageState("uuid-page", "a");
		expect(manager.getState("uuid-page", "a")).toEqual({});
		expect(manager.getState("uuid-page", "b")).toEqual({ b1: 2 });
	});
});
