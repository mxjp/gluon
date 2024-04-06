import { teardown } from "../core/lifecycle.js";
import { batch, sig } from "../core/signals.js";
import { normalize, trimBase } from "./path.js";
import { QueryInit, Router } from "./router.js";

export interface HistoryRouterOptions {
	/**
	 * The current location is parsed when one of these events occur.
	 *
	 * @default ["popstate", "gluon:router:update"]
	 */
	parseEvents?: string[];

	/**
	 * The leading base path to ignore when matching routes.
	 *
	 * @default ""
	 */
	basePath?: string;
}

/**
 * A router that uses the history API.
 */
export class HistoryRouter implements Router {
	#basePath: string;
	#path = sig<string>(undefined!);
	#query = sig<URLSearchParams | undefined>(undefined!);

	constructor(options?: HistoryRouterOptions) {
		this.#basePath = options?.basePath ?? "";
		const parseEvents = options?.parseEvents ?? ["popstate", "gluon:router:update"];
		for (const name of parseEvents) {
			window.addEventListener(name, this.#parse, { passive: true });
			teardown(() => window.removeEventListener(name, this.#parse));
		}
		this.#parse();
	}

	#parse = () => {
		batch(() => {
			this.#path.value = trimBase(this.#basePath, location.pathname) ?? normalize(location.pathname);
			const query = location.search.slice(1);
			this.#query.value = query ? new URLSearchParams(query) : undefined;
		});
	};

	get root(): Router {
		return this;
	}

	get parent(): Router | undefined {
		return undefined;
	}

	get path(): string {
		return this.#path.value;
	}

	get query(): URLSearchParams | undefined {
		return this.#query.value;
	}

	push(path: string, query?: QueryInit): void {
		history.pushState(null, "", formatPath(path, query));
		window.dispatchEvent(new CustomEvent("gluon:router:update"));
	}

	replace(path: string, query?: QueryInit): void {
		history.replaceState(null, "", formatPath(path, query));
		window.dispatchEvent(new CustomEvent("gluon:router:update"));
	}
}

/**
 * Format a path with optional query parameters for use in `location.href` or the history API.
 */
export function formatPath(path: string, query?: QueryInit): string {
	return `${path || "/"}${query === undefined ? "" : `?${new URLSearchParams(query)}`}`;
}
