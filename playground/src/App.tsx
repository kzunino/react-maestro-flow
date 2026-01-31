import { useCallback, useEffect, useState } from "react";
import type { FlowStateByPage } from "react-maestro-flow";
import { createPathParamsAdapter, Flow } from "react-maestro-flow";
import Landing from "./pages/Landing";
import { componentLoaders, graph } from "./wizard-config";

const PAGE_WIDTH = "40rem";

// Stable adapters per route type – reuse so Flow's useUrlParams doesn't churn on popstate
const pattern1Adapter = createPathParamsAdapter({
	template: "/[id]/page/[page]",
});
const pattern2Adapter = createPathParamsAdapter({
	template: "/[id]/[type]/[someOtherOptions]/[page]",
});

function getRouteConfig() {
	const pathname = window.location.pathname;

	// Pattern 1: /[id]/page/[page]
	const pattern1Match = pathname.match(/^\/([^/]+)\/page\/([^/]+)$/);
	if (pattern1Match) {
		return {
			type: "pattern1" as const,
			adapter: pattern1Adapter,
			pageParamName: "page",
			uuidParamName: "id",
		};
	}

	// Pattern 2: /[id]/[type]/[someOtherOptions]/[page]
	const pattern2Match = pathname.match(
		/^\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)$/,
	);
	if (pattern2Match) {
		return {
			type: "pattern2" as const,
			adapter: pattern2Adapter,
			pageParamName: "page",
			uuidParamName: "id",
		};
	}

	return {
		type: "query" as const,
		adapter: undefined,
		pageParamName: "page",
		uuidParamName: "id",
	};
}

export default function App() {
	const [routeConfig, setRouteConfig] = useState(() => getRouteConfig());
	const [showLanding, setShowLanding] = useState(() => {
		const pathname = window.location.pathname;
		const search = window.location.search;
		// Show landing only if path is "/" and no query params
		return (pathname === "/" || pathname === "") && !search;
	});
	const [flowPage, setFlowPage] = useState<string | null>(null);
	const [flowPreviousPage, setFlowPreviousPage] = useState<string | null>(null);
	const [flowState, setFlowState] = useState<FlowStateByPage>({});

	const handlePageChange = useCallback(
		(
			page: string | null,
			previousPage: string | null,
			state: FlowStateByPage,
		) => {
			setFlowPage(page);
			setFlowPreviousPage(previousPage);
			setFlowState(state ?? {});
		},
		[],
	);

	// Listen for navigation changes
	useEffect(() => {
		const handlePopState = () => {
			const pathname = window.location.pathname;
			const search = window.location.search;
			setShowLanding((pathname === "/" || pathname === "") && !search);
			setRouteConfig(getRouteConfig());
		};

		const handleRouteChange = () => {
			const pathname = window.location.pathname;
			const search = window.location.search;
			setShowLanding((pathname === "/" || pathname === "") && !search);
			setRouteConfig(getRouteConfig());
		};

		window.addEventListener("popstate", handlePopState);
		window.addEventListener("routechange", handleRouteChange);
		return () => {
			window.removeEventListener("popstate", handlePopState);
			window.removeEventListener("routechange", handleRouteChange);
		};
	}, []);

	if (showLanding) {
		return (
			<div className="w-full">
				<div
					style={{
						width: PAGE_WIDTH,
						maxWidth: "100%",
						marginLeft: "auto",
						marginRight: "auto",
					}}
				>
					<Landing />
				</div>
			</div>
		);
	}

	return (
		<div className="w-full">
			<div
				style={{
					width: PAGE_WIDTH,
					maxWidth: "100%",
					marginLeft: "auto",
					marginRight: "auto",
				}}
			>
				<div className="mb-4 space-y-2">
					<div className="p-2 bg-gray-100 rounded text-sm">
						<strong>Route:</strong>{" "}
						{routeConfig.type === "query" && "Query Params"}
						{routeConfig.type === "pattern1" && "/[id]/page/[page]"}
						{routeConfig.type === "pattern2" &&
							"/[id]/[type]/[someOtherOptions]/[page]"}
						{" | "}
						<button
							type="button"
							onClick={() => {
								window.history.pushState({}, "", "/");
								window.dispatchEvent(new PopStateEvent("popstate"));
								window.dispatchEvent(new CustomEvent("routechange"));
							}}
							className="text-blue-600 hover:underline"
						>
							← Back to Landing
						</button>
					</div>
					<div className="p-2 bg-amber-50 border border-amber-200 rounded text-sm font-mono break-all">
						<strong>onPageChange:</strong> page=
						{flowPage ?? graph.entryPoint ?? "—"} | previous=
						{flowPreviousPage ?? "null"}
						{flowState != null && Object.keys(flowState).length > 0 && (
							<> | state={JSON.stringify(flowState)}</>
						)}
					</div>
				</div>
				<Flow
					graph={graph}
					config={{
						componentLoaders,
						urlParamsAdapter: routeConfig.adapter,
						pageParamName: routeConfig.pageParamName,
						uuidParamName: routeConfig.uuidParamName,
						onPageChange: handlePageChange,
					}}
				/>
			</div>
		</div>
	);
}
