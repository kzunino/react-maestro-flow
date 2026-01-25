import { createWizardGraphFromNodes } from "@/wizard/graph";
import { definePageSchema } from "@/wizard/schema-types";
import type { WizardGraph, WizardNode } from "@/wizard/types";

// Define typed schema for page A with multiple fields
const pageASchema = definePageSchema({
	type: "object",
	properties: {
		name: { type: "string" },
		age: { type: "number" },
		address: { type: "string" },
	},
});

// Define all nodes for the test wizard
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
		// Conditional branching based on userType
		// Note: state is flattened from all pages, so we access userType directly
		// The state from pageB will be in the flattened state object
		next: (state) => {
			const userType = state.userType as string | undefined;
			// Branch to pageE if userType is "premium", otherwise go to pageC
			if (userType === "premium") {
				return "pageE";
			}
			return "pageC";
		},
	},
	{
		page: "pageC",
		form: {
			type: "object",
			properties: {},
		},
		schemaContext: {
			type: "object",
			properties: {},
		},
		previous: "pageB",
		next: "pageD",
	},
	{
		page: "pageD",
		form: {
			type: "object",
			properties: {
				confirm: { type: "boolean" },
			},
		},
		schemaContext: {
			type: "object",
			properties: {
				confirm: { type: "boolean" },
			},
		},
		previous: "pageC",
	},
	// New branch page for premium users
	{
		page: "pageE",
		form: {
			type: "object",
			properties: {
				premiumFeature: { type: "string" },
			},
		},
		schemaContext: {
			type: "object",
			properties: {
				premiumFeature: { type: "string" },
			},
		},
		previous: "pageB",
		next: "pageD", // Both branches converge on pageD
	},
];

// Create and export the graph
export const testWizardGraph: WizardGraph = createWizardGraphFromNodes(
	nodes,
	"pageA",
);
