import { createPathParamsAdapter } from "@/flow/pathParamHelpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("pathParamHelpers", () => {
	const originalLocation = window.location;
	const originalHistory = window.history;

	beforeEach(() => {
		Object.defineProperty(window, "location", {
			value: {
				pathname: "/abc123/page/pageA",
				origin: "http://localhost",
				href: "http://localhost/abc123/page/pageA",
			},
			writable: true,
		});
		window.history.pushState = vi.fn();
		window.history.replaceState = vi.fn();
	});

	afterEach(() => {
		Object.defineProperty(window, "location", {
			value: originalLocation,
			writable: true,
		});
		window.history.pushState = originalHistory.pushState;
		window.history.replaceState = originalHistory.replaceState;
	});

	it("getParam returns value from current pathname", () => {
		const adapter = createPathParamsAdapter({
			template: "/[id]/page/[page]",
		});
		expect(adapter.getParam("id")).toBe("abc123");
		expect(adapter.getParam("page")).toBe("pageA");
	});

	it("getParam returns null for missing param", () => {
		const adapter = createPathParamsAdapter({
			template: "/[id]/page/[page]",
		});
		expect(adapter.getParam("missing")).toBe(null);
	});

	it("getAllParams returns all parsed params", () => {
		const adapter = createPathParamsAdapter({
			template: "/[id]/page/[page]",
		});
		expect(adapter.getAllParams()).toEqual({ id: "abc123", page: "pageA" });
	});

	it("setParam calls pushState with new path", () => {
		const adapter = createPathParamsAdapter({
			template: "/[id]/page/[page]",
		});
		adapter.setParam("page", "pageB");
		expect(window.history.pushState).toHaveBeenCalledWith(
			{},
			"",
			"/abc123/page/pageB",
		);
	});

	it("replaceParam calls replaceState with new path", () => {
		const adapter = createPathParamsAdapter({
			template: "/[id]/page/[page]",
		});
		adapter.replaceParam("page", "pageC");
		expect(window.history.replaceState).toHaveBeenCalledWith(
			{},
			"",
			"/abc123/page/pageC",
		);
	});

	it("works with basePath", () => {
		Object.defineProperty(window, "location", {
			value: { pathname: "/flow/xyz/pageB", origin: "", href: "" },
			writable: true,
		});
		const adapter = createPathParamsAdapter({
			template: "/[id]/[page]",
			basePath: "/flow",
		});
		expect(adapter.getParam("id")).toBe("xyz");
		expect(adapter.getParam("page")).toBe("pageB");
	});
});
