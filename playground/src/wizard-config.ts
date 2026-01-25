import type { WizardGraph, WizardNode } from "react-maestro";
import {
	createWizardGraphFromNodes,
	definePageSchema,
} from "react-maestro";

const pageASchema = definePageSchema({
	type: "object",
	properties: {
		name: { type: "string" },
		age: { type: "number" },
		address: { type: "string" },
	},
});

const nodes: WizardNode[] = [
	{
		page: "pageA",
		form: pageASchema,
		schemaContext: pageASchema,
		next: "pageB",
	},
	{
		page: "pageB",
		form: {
			type: "object",
			properties: {
				email: { type: "string" },
				userType: { type: "string" },
			},
		},
		schemaContext: {
			type: "object",
			properties: {
				email: { type: "string" },
				userType: { type: "string" },
			},
		},
		previous: "pageA",
		next: (state) => {
			const userType = state.userType as string | undefined;
			if (userType === "premium") return "pageE";
			return "pageC";
		},
	},
	{
		page: "pageC",
		form: { type: "object", properties: {} },
		schemaContext: { type: "object", properties: {} },
		previous: "pageB",
		next: "pageD",
	},
	{
		page: "pageD",
		form: {
			type: "object",
			properties: { confirm: { type: "boolean" } },
		},
		schemaContext: {
			type: "object",
			properties: { confirm: { type: "boolean" } },
		},
		previous: "pageC",
	},
	{
		page: "pageE",
		form: {
			type: "object",
			properties: { premiumFeature: { type: "string" } },
		},
		schemaContext: {
			type: "object",
			properties: { premiumFeature: { type: "string" } },
		},
		previous: "pageB",
		next: "pageD",
	},
];

export const graph: WizardGraph = createWizardGraphFromNodes(
	nodes,
	"pageA",
);

export const componentLoaders = new Map([
	["pageA", () => import("./pages/PageA")],
	["pageB", () => import("./pages/PageB")],
	["pageC", () => import("./pages/PageC")],
	["pageD", () => import("./pages/PageD")],
	["pageE", () => import("./pages/PageE")],
	["__expired__", () => import("./pages/Expired")],
	["__notfound__", () => import("./pages/PageNotFound")],
]);
