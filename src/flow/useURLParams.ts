import { useCallback, useEffect, useState } from "react";
import type { UrlParamsAdapter } from "@/flow/types";

/**
 * Default browser-based URL params adapter
 */
export const browserUrlParamsAdapter: UrlParamsAdapter = {
	getParam: (key: string): string | null => {
		if (typeof window === "undefined") {
			return null;
		}
		const params = new URLSearchParams(window.location.search);
		return params.get(key);
	},

	setParam: (key: string, value: string): void => {
		if (typeof window === "undefined") {
			return;
		}
		const url = new URL(window.location.href);
		url.searchParams.set(key, value);
		window.history.pushState({}, "", url.toString());
	},

	replaceParam: (key: string, value: string): void => {
		if (typeof window === "undefined") {
			return;
		}
		const url = new URL(window.location.href);
		url.searchParams.set(key, value);
		window.history.replaceState({}, "", url.toString());
	},

	getAllParams: (): Record<string, string> => {
		if (typeof window === "undefined") {
			return {};
		}
		const params = new URLSearchParams(window.location.search);
		const result: Record<string, string> = {};
		for (const [key, value] of params.entries()) {
			result[key] = value;
		}
		return result;
	},

	replaceParams: (params: Record<string, string>): void => {
		if (typeof window === "undefined") {
			return;
		}
		const url = new URL(window.location.href);
		// Clear existing params
		url.search = "";
		// Set new params
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.set(key, value);
		}
		window.history.replaceState({}, "", url.toString());
	},
};

/**
 * Hook for managing URL parameters in a framework-agnostic way
 */
export function useUrlParams(
	adapter: UrlParamsAdapter = browserUrlParamsAdapter,
) {
	const [params, setParams] = useState<Record<string, string>>(() =>
		adapter.getAllParams(),
	);

	// Sync with URL changes (browser back/forward) and when adapter changes
	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		// Re-read from current URL when adapter changes (e.g. after popstate + parent re-render)
		setParams(adapter.getAllParams());

		const handlePopState = () => {
			setParams(adapter.getAllParams());
		};

		window.addEventListener("popstate", handlePopState);
		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, [adapter]);

	const getParam = useCallback(
		(key: string): string | null => {
			return adapter.getParam(key);
		},
		[adapter],
	);

	const setParam = useCallback(
		(key: string, value: string): void => {
			adapter.setParam(key, value);
			setParams(adapter.getAllParams());
		},
		[adapter],
	);

	const replaceParam = useCallback(
		(key: string, value: string): void => {
			adapter.replaceParam(key, value);
			setParams(adapter.getAllParams());
		},
		[adapter],
	);

	const getAllParams = useCallback((): Record<string, string> => {
		return adapter.getAllParams();
	}, [adapter]);

	const replaceParams = useCallback(
		(newParams: Record<string, string>): void => {
			adapter.replaceParams(newParams);
			setParams(adapter.getAllParams());
		},
		[adapter],
	);

	return {
		getParam,
		setParam,
		replaceParam,
		getAllParams,
		replaceParams,
		params,
	};
}
