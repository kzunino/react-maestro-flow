// Graph orchestration

// Main Flow component
export {
	Flow,
	type FlowConfig,
	type FlowProps,
} from "@/flow/Flow";
// Context
export {
	FlowContext,
	useFlowContext,
} from "@/flow/FlowContext";
export {
	createFlowGraph,
	getAllNextPages,
	getNextNonSkippedPage,
	getNextPage,
	getNode,
	getPagesInOrder,
	getPreviousNonSkippedPage,
	getPreviousPage,
	initializeFlow,
	registerNode,
	resolveNextPage,
	shouldSkipStep,
	validateGraph,
} from "@/flow/graphHelpers";
// Presenter
export {
	Presenter,
	type PresenterProps,
} from "@/flow/NodePresenter";
// Path params (for dynamic URL segments)
export {
	createPathParamsAdapter,
	createPathParamsAdapterFromProps,
	type PathConfig,
} from "@/flow/pathParamHelpers";
export type {
	FlowContextValue,
	FlowGraph,
	FlowNode,
	FlowState,
	NextPageResolver,
	UrlParamsAdapter,
	UseFlowReturn,
} from "@/flow/types";
// Hooks
export { useFlow } from "@/flow/useFlow";
export { useUrlParams } from "@/flow/useURLParams";
