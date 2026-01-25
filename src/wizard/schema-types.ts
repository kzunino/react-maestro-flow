/**
 * Type helpers for converting JSON Schema to TypeScript types
 */

/**
 * JSON Schema property definition
 */
type JSONSchemaProperty = {
	type?: string;
	enum?: readonly unknown[];
	items?: JSONSchemaProperty;
	properties?: Record<string, JSONSchemaProperty>;
	required?: string[];
};

/**
 * Converts a JSON Schema type string to a TypeScript type
 */
type SchemaTypeToTS<T extends string | undefined> = T extends "string"
	? string
	: T extends "number"
		? number
		: T extends "integer"
			? number
			: T extends "boolean"
				? boolean
				: T extends "array"
					? unknown[]
					: T extends "object"
						? Record<string, unknown>
						: unknown;

/**
 * Extracts TypeScript type from a JSON Schema property
 */
type ExtractTypeFromSchema<T extends JSONSchemaProperty> =
	"enum" extends keyof T
		? T["enum"] extends readonly (infer E)[]
			? E
			: unknown
		: "type" extends keyof T
			? T["type"] extends string
				? SchemaTypeToTS<T["type"]>
				: unknown
			: "items" extends keyof T
				? T["items"] extends JSONSchemaProperty
					? ExtractTypeFromSchema<T["items"]>[]
					: unknown[]
				: unknown;

/**
 * Extracts TypeScript types from a JSON Schema object
 */
export type SchemaToType<
	T extends { type: "object"; properties?: Record<string, JSONSchemaProperty> },
> = T["properties"] extends Record<string, JSONSchemaProperty>
	? {
			[K in keyof T["properties"]]: ExtractTypeFromSchema<T["properties"][K]>;
		}
	: Record<string, unknown>;

/**
 * Helper to define a typed schema for a wizard page
 * This ensures the schemaContext matches the TypeScript type
 */
export function definePageSchema<
	T extends {
		type: "object";
		properties: Record<string, JSONSchemaProperty>;
	},
>(schema: T): T & { __type: SchemaToType<T> } {
	return schema as T & { __type: SchemaToType<T> };
}

/**
 * Type helper to extract the state type from a schema
 */
export type PageStateType<T extends { __type: unknown }> = T["__type"];
