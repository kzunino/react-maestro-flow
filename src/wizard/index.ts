// Types

// Graph orchestration
export {
	createWizardGraph,
	createWizardGraphFromNodes,
	getAllNextPages,
	getNextNonSkippedPage,
	getNextPage,
	getNode,
	getPagesInOrder,
	getPreviousNonSkippedPage,
	getPreviousPage,
	registerNode,
	resolveNextPage,
	shouldSkipStep,
	validateGraph,
} from "@/wizard/graph";
// Hooks
export { useWizard } from "@/wizard/hooks";
// Presenter
export {
	Presenter,
	type PresenterProps,
} from "@/wizard/Presenter";
// Path params (for dynamic URL segments)
export {
	createPathParamsAdapter,
	createPathParamsAdapterFromProps,
	type PathConfig,
} from "@/wizard/path-params";
// State management
export {
	defaultStateManager,
	WizardStateManager,
} from "@/wizard/state";
export type {
	NextPageResolver,
	UrlParamsAdapter,
	UseWizardReturn,
	WizardContextValue,
	WizardGraph,
	WizardNode,
	WizardState,
} from "@/wizard/types";
// URL params
export { useUrlParams } from "@/wizard/url-params";
// Main Wizard component
export {
	Wizard,
	type WizardConfig,
	type WizardProps,
} from "@/wizard/Wizard";
// Context
export {
	useWizardContext,
	WizardContext,
} from "@/wizard/WizardContext";
