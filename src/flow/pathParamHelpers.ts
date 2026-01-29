import type { UrlParamsAdapter } from "@/flow/types";

/**
 * Configuration for path-based URL parameters
 * Defines the structure of the URL path with named segments
 *
 * Example: "/[id]/page/[page]" would match "/abc123/page/pageA"
 * and extract { id: "abc123", page: "pageA" }
 */
export type PathConfig = {
	/**
	 * Path template with named segments in brackets
	 * Example: "/[id]/page/[page]" or "/wizard/[id]/[page]"
	 */
	template: string;

	/**
	 * Base path to prepend to the template (optional)
	 * Example: "/wizard" would make the full path "/wizard/[id]/page/[page]"
	 */
	basePath?: string;
};

/**
 * Parses a path template and extracts parameter names
 * Example: "/[id]/page/[page]" -> ["id", "page"]
 */
function parsePathTemplate(template: string): string[] {
	const matches = template.match(/\[([^\]]+)\]/g);
	if (!matches) {
		return [];
	}
	return matches.map((match) => match.slice(1, -1));
}

/**
 * Builds a path from a template and parameter values
 * Example: template="/[id]/page/[page]", params={id: "abc", page: "pageA"}
 * Result: "/abc/page/pageA"
 */
function buildPath(template: string, params: Record<string, string>): string {
	let path = template;
	for (const [key, value] of Object.entries(params)) {
		path = path.replace(`[${key}]`, encodeURIComponent(value));
	}
	return path;
}

/**
 * Parses a URL path and extracts parameter values based on a template
 * Example: path="/en/wizard/abc/pageA", template="/wizard/[id]/[page]"
 * Result: { id: "abc", page: "pageA" }
 */
function parsePath(path: string, template: string): Record<string, string> {
	const params: Record<string, string> = {};
	const paramNames = parsePathTemplate(template);

	if (paramNames.length === 0) {
		return params;
	}

	// Convert template to regex pattern
	// Allow optional leading segments (like /en) before the template
	const pattern = template
		.replace(/\[([^\]]+)\]/g, "([^/]+)") // Replace [param] with capture group
		.replace(/\//g, "\\/"); // Escape slashes

	// Make the pattern match from the end or allow optional prefix
	// This handles cases like /en/wizard/[id]/[page] matching /en/wizard/abc/pageA
	const regex = new RegExp(`${pattern}$`);
	const matches = path.match(regex);

	if (matches) {
		// matches[0] is the full match, matches[1..] are the captured groups
		for (let i = 0; i < paramNames.length; i++) {
			const value = matches[i + 1];
			if (value) {
				params[paramNames[i]] = decodeURIComponent(value);
			}
		}
	}

	return params;
}

/**
 * Creates a path-based URL params adapter
 * This adapter uses URL path segments instead of query parameters
 *
 * @param config - Path configuration defining the URL structure
 * @returns A UrlParamsAdapter that works with path segments
 *
 * @example
 * ```ts
 * const adapter = createPathParamsAdapter({
 *   template: "/[id]/page/[page]"
 * });
 * // URLs will be like: /abc123/page/pageA
 * ```
 */
export function createPathParamsAdapter(config: PathConfig): UrlParamsAdapter {
	const fullTemplate = config.basePath
		? `${config.basePath}${config.template}`
		: config.template;

	const paramNames = parsePathTemplate(fullTemplate);

	const getCurrentPath = (): string => {
		if (typeof window === "undefined") {
			return "";
		}
		return window.location.pathname;
	};

	const getCurrentParams = (): Record<string, string> => {
		const path = getCurrentPath();
		return parsePath(path, fullTemplate);
	};

	const buildFullPath = (params: Record<string, string>): string => {
		// Get current params and merge with new ones
		const currentParams = getCurrentParams();
		const mergedParams = { ...currentParams, ...params };

		// Ensure all required params are present
		for (const paramName of paramNames) {
			if (!mergedParams[paramName]) {
				// Keep existing value if available
				const currentValue = getCurrentParams()[paramName];
				if (currentValue) {
					mergedParams[paramName] = currentValue;
				}
			}
		}

		const newPath = buildPath(fullTemplate, mergedParams);

		// If the current path has segments before our template (like /en),
		// preserve them in the new path
		const currentPath = getCurrentPath();
		const templateStart = currentPath.indexOf(fullTemplate.split("[")[0]);
		if (templateStart > 0) {
			// There's a prefix before our template, preserve it
			const prefix = currentPath.slice(0, templateStart);
			return prefix + newPath;
		}

		return newPath;
	};

	return {
		getParam: (key: string): string | null => {
			const params = getCurrentParams();
			return params[key] || null;
		},

		setParam: (key: string, value: string): void => {
			if (typeof window === "undefined") {
				return;
			}

			// Only update if this param is in the template
			if (!paramNames.includes(key)) {
				console.warn(
					`Parameter "${key}" is not defined in path template: ${fullTemplate}`,
				);
				return;
			}

			const newPath = buildFullPath({ [key]: value });
			window.history.pushState({}, "", newPath);
		},

		replaceParam: (key: string, value: string): void => {
			if (typeof window === "undefined") {
				return;
			}

			// Only update if this param is in the template
			if (!paramNames.includes(key)) {
				console.warn(
					`Parameter "${key}" is not defined in path template: ${fullTemplate}`,
				);
				return;
			}

			const newPath = buildFullPath({ [key]: value });
			window.history.replaceState({}, "", newPath);
		},

		getAllParams: (): Record<string, string> => {
			return getCurrentParams();
		},

		replaceParams: (params: Record<string, string>): void => {
			if (typeof window === "undefined") {
				return;
			}

			// Validate all params are in template
			for (const key of Object.keys(params)) {
				if (!paramNames.includes(key)) {
					console.warn(
						`Parameter "${key}" is not defined in path template: ${fullTemplate}`,
					);
				}
			}

			const newPath = buildFullPath(params);
			window.history.replaceState({}, "", newPath);
		},
	};
}

/**
 * Framework-agnostic path params adapter that reads initial params from props
 * Works with any framework that provides route params (Next.js, Remix, etc.)
 * Uses browser History API for navigation, making it framework-agnostic
 *
 * @param pathParams - Route params from your framework (can be a Promise in Next.js 15+)
 * @param config - Path configuration
 * @returns A UrlParamsAdapter that works with path segments
 *
 * @example
 * ```tsx
 * // Next.js example
 * export default function FlowPage({ params }: { params: Promise<{ id: string; page: string }> }) {
 *   const resolvedParams = use(params);
 *   const adapter = createPathParamsAdapterFromProps(
 *     resolvedParams,
 *     { template: "/[id]/[page]", basePath: "/flow" }
 *   );
 *   return <Flow graph={graph} config={{ urlParamsAdapter: adapter }} />;
 * }
 *
 * // Other frameworks (Remix, etc.)
 * export default function FlowPage({ params }: { params: { id: string; page: string } }) {
 *   const adapter = createPathParamsAdapterFromProps(
 *     params,
 *     { template: "/[id]/[page]", basePath: "/flow" }
 *   );
 *   return <Flow graph={graph} config={{ urlParamsAdapter: adapter }} />;
 * }
 * ```
 */
export function createPathParamsAdapterFromProps(
	_pathParams:
		| Record<string, string | string[]>
		| Promise<Record<string, string | string[]>>,
	config: PathConfig,
): UrlParamsAdapter {
	const fullTemplate = config.basePath
		? `${config.basePath}${config.template}`
		: config.template;

	const paramNames = parsePathTemplate(fullTemplate);

	// Read params from the URL path directly (framework-agnostic)
	// The URL is always the source of truth, even on initial render
	const getCurrentPath = (): string => {
		if (typeof window === "undefined") {
			return "";
		}
		return window.location.pathname;
	};

	const getCurrentParamsFromUrl = (): Record<string, string> => {
		const path = getCurrentPath();
		return parsePath(path, fullTemplate);
	};

	// Always read from URL - the URL is the source of truth
	const getParams = (): Record<string, string> => {
		return getCurrentParamsFromUrl();
	};

	const buildFullPath = (params: Record<string, string>): string => {
		const current = getParams();
		const mergedParams = { ...current, ...params };
		return buildPath(fullTemplate, mergedParams);
	};

	return {
		getParam: (key: string): string | null => {
			const params = getParams();
			return params[key] || null;
		},

		setParam: (key: string, value: string): void => {
			if (typeof window === "undefined") {
				return;
			}

			if (!paramNames.includes(key)) {
				console.warn(
					`Parameter "${key}" is not defined in path template: ${fullTemplate}`,
				);
				return;
			}

			const newPath = buildFullPath({ [key]: value });
			window.history.pushState({}, "", newPath);
		},

		replaceParam: (key: string, value: string): void => {
			if (typeof window === "undefined") {
				return;
			}

			if (!paramNames.includes(key)) {
				console.warn(
					`Parameter "${key}" is not defined in path template: ${fullTemplate}`,
				);
				return;
			}

			const newPath = buildFullPath({ [key]: value });
			window.history.replaceState({}, "", newPath);
		},

		getAllParams: (): Record<string, string> => {
			return { ...getParams() };
		},

		replaceParams: (params: Record<string, string>): void => {
			if (typeof window === "undefined") {
				return;
			}

			for (const key of Object.keys(params)) {
				if (!paramNames.includes(key)) {
					console.warn(
						`Parameter "${key}" is not defined in path template: ${fullTemplate}`,
					);
				}
			}

			const newPath = buildFullPath(params);
			window.history.replaceState({}, "", newPath);
		},
	};
}
