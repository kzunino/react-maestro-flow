import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Presenter } from "@/flow/NodePresenter";

function DummyPage() {
	return <div data-testid="dummy-page">Dummy</div>;
}

describe("NodePresenter", () => {
	it("returns null when page is null", () => {
		const { container } = render(
			<Presenter
				page={null}
				node={undefined}
				componentLoaders={new Map()}
			/>,
		);
		expect(container.firstChild).toBeNull();
	});

	it("returns null when node is null and page is not special", () => {
		const { container } = render(
			<Presenter
				page="somePage"
				node={undefined}
				componentLoaders={new Map()}
			/>,
		);
		expect(container.firstChild).toBeNull();
	});

	it("returns null when no loader for page", () => {
		const { container } = render(
			<Presenter
				page="missing"
				node={{ currentPage: "missing" }}
				componentLoaders={new Map()}
			/>,
		);
		expect(container.firstChild).toBeNull();
	});

	it("renders component when loader resolves", async () => {
		const loaders = new Map([
			[
				"dummy",
				() =>
					Promise.resolve({
						default: DummyPage,
					}),
			],
		]);
		render(
			<Presenter
				page="dummy"
				node={{ currentPage: "dummy" }}
				componentLoaders={loaders}
			/>,
		);
		expect(await screen.findByTestId("dummy-page")).toHaveTextContent("Dummy");
	});
});
