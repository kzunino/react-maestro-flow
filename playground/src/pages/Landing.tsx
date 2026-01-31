import { Button } from "../components/Button";

export default function Landing() {
	const handleRoute = (path: string) => {
		window.history.pushState({}, "", path);
		window.dispatchEvent(new PopStateEvent("popstate"));
		window.dispatchEvent(new CustomEvent("routechange"));
	};

	return (
		<div className="p-8">
			<div className="space-y-6">
				<h1 className="text-3xl font-bold">React Maestro · Test Routes</h1>
				<p className="text-muted-foreground">
					Select a route pattern to test different wizard configurations:
				</p>

				<div className="space-y-4">
					<div className="p-4 border rounded-md">
						<h2 className="text-xl font-semibold mb-2">
							Query Params (Default)
						</h2>
						<p className="text-sm text-muted-foreground mb-3">
							Uses query parameters: <code>?page=pageA&id=abc123</code>
						</p>
						<Button onClick={() => handleRoute("/?page=pageA")}>
							Test Query Params
						</Button>
					</div>

					<div className="p-4 border rounded-md">
						<h2 className="text-xl font-semibold mb-2">Path Pattern 1</h2>
						<p className="text-sm text-muted-foreground mb-3">
							Route: <code>/[id]/page/[page]</code>
							<br />
							Example: <code>/abc123/page/pageA</code>
						</p>
						<Button onClick={() => handleRoute("/test123/page/pageA")}>
							Test /[id]/page/[page]
						</Button>
					</div>

					<div className="p-4 border rounded-md">
						<h2 className="text-xl font-semibold mb-2">Path Pattern 2</h2>
						<p className="text-sm text-muted-foreground mb-3">
							Route: <code>/[id]/[type]/[someOtherOptions]/[page]</code>
							<br />
							Example: <code>/xyz789/premium/feature1/pageA</code>
						</p>
						<Button
							onClick={() => handleRoute("/xyz789/premium/feature1/pageA")}
						>
							Test /[id]/[type]/[someOtherOptions]/[page]
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
