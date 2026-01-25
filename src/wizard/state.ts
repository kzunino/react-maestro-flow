import { getPagesInOrder } from "@/wizard/graph";
import type { WizardGraph, WizardState } from "@/wizard/types";

/**
 * Session storage key prefix for wizard state
 */
const STORAGE_PREFIX = "wizard:";

/**
 * Structure for storing page state in session storage
 */
type PageStateEntry = {
	page: string;
	state: WizardState;
};

/**
 * Manager for wizard state stored in session storage
 * Uses UUID-based storage with array structure: wizard:{uuid}: [{ page, state }, ...]
 */
export class WizardStateManager {
	private prefix: string;

	constructor(prefix: string = STORAGE_PREFIX) {
		this.prefix = prefix;
	}

	/**
	 * Gets the storage key for a wizard UUID
	 */
	private getStorageKey(uuid: string): string {
		return `${this.prefix}${uuid}`;
	}

	/**
	 * Gets all page state entries for a wizard UUID
	 */
	private getPageStateEntries(uuid: string): PageStateEntry[] {
		if (typeof window === "undefined" || !window.sessionStorage) {
			return [];
		}

		const storageKey = this.getStorageKey(uuid);
		const stored = window.sessionStorage.getItem(storageKey);

		if (!stored) {
			return [];
		}

		try {
			return JSON.parse(stored) as PageStateEntry[];
		} catch (error) {
			console.warn(`Failed to parse state for UUID "${uuid}":`, error);
			return [];
		}
	}

	/**
	 * Saves all page state entries for a wizard UUID
	 */
	private setPageStateEntries(uuid: string, entries: PageStateEntry[]): void {
		if (typeof window === "undefined" || !window.sessionStorage) {
			return;
		}

		const storageKey = this.getStorageKey(uuid);
		try {
			window.sessionStorage.setItem(storageKey, JSON.stringify(entries));
		} catch (error) {
			console.error(`Failed to save state for UUID "${uuid}":`, error);
		}
	}

	/**
	 * Pre-registers all expected state keys from the graph
	 * This allows us to see all expected state upfront
	 */
	preRegisterState(graph: WizardGraph, uuid: string): void {
		if (typeof window === "undefined" || !window.sessionStorage) {
			return;
		}

		const entries = this.getPageStateEntries(uuid);
		const pages = getPagesInOrder(graph);
		const existingPages = new Set(entries.map((e) => e.page));

		// Initialize entries for pages that don't exist yet
		for (const page of pages) {
			if (!existingPages.has(page)) {
				entries.push({ page, state: {} });
			}
		}

		// Save the updated entries
		this.setPageStateEntries(uuid, entries);
	}

	/**
	 * Gets state for a specific page
	 */
	getState(uuid: string, page: string): WizardState {
		const entries = this.getPageStateEntries(uuid);
		const entry = entries.find((e) => e.page === page);
		return entry?.state || {};
	}

	/**
	 * Sets state for a specific page
	 */
	setState(uuid: string, page: string, key: string, value: unknown): void {
		const entries = this.getPageStateEntries(uuid);
		let entry = entries.find((e) => e.page === page);

		if (!entry) {
			entry = { page, state: {} };
			entries.push(entry);
		}

		entry.state[key] = value;
		this.setPageStateEntries(uuid, entries);
	}

	/**
	 * Sets multiple state values for a page at once
	 */
	setStateBatch(
		uuid: string,
		page: string,
		updates: Record<string, unknown>,
	): void {
		const entries = this.getPageStateEntries(uuid);
		let entry = entries.find((e) => e.page === page);

		if (!entry) {
			entry = { page, state: {} };
			entries.push(entry);
		}

		Object.assign(entry.state, updates);
		this.setPageStateEntries(uuid, entries);
	}

	/**
	 * Gets accumulated state from all pages in the graph
	 */
	getAllState(_graph: WizardGraph, uuid: string): WizardState {
		const allState: WizardState = {};
		const entries = this.getPageStateEntries(uuid);

		// Merge state from all pages (later pages override earlier ones)
		for (const entry of entries) {
			Object.assign(allState, entry.state);
		}

		return allState;
	}

	/**
	 * Gets state for all pages up to and including the specified page
	 */
	getStateUpTo(_graph: WizardGraph, uuid: string, page: string): WizardState {
		const allState: WizardState = {};
		const entries = this.getPageStateEntries(uuid);
		const pages = getPagesInOrder(_graph);

		// Only include pages up to the specified page
		for (const p of pages) {
			const entry = entries.find((e) => e.page === p);
			if (entry) {
				Object.assign(allState, entry.state);
			}

			if (p === page) {
				break;
			}
		}

		return allState;
	}

	/**
	 * Checks if state exists for a specific UUID
	 */
	hasState(uuid: string): boolean {
		if (typeof window === "undefined" || !window.sessionStorage) {
			return false;
		}

		const storageKey = this.getStorageKey(uuid);
		const stored = window.sessionStorage.getItem(storageKey);
		return stored !== null && stored !== "";
	}

	/**
	 * Clears all wizard state for a specific UUID
	 */
	clearState(uuid: string): void {
		if (typeof window === "undefined" || !window.sessionStorage) {
			return;
		}

		const storageKey = this.getStorageKey(uuid);
		window.sessionStorage.removeItem(storageKey);
	}

	/**
	 * Clears state for a specific page within a wizard UUID
	 */
	clearPageState(uuid: string, page: string): void {
		const entries = this.getPageStateEntries(uuid);
		const filtered = entries.filter((e) => e.page !== page);
		this.setPageStateEntries(uuid, filtered);
	}
}

/**
 * Default instance of WizardStateManager
 */
export const defaultStateManager = new WizardStateManager();
