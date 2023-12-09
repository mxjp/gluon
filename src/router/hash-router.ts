import { batch, sig, teardown } from "../core/index.js";
import { normalizePath } from "./path.js";
import { QueryInit, Router } from "./router.js";

export interface HashRouterOptions {
	/**
	 * The current location is parsed when one of these events occur.
	 *
	 * @default ["hashchange"]
	 */
	parseEvents?: string[];
}

export class HashRouter implements Router {
	#path = sig<string>(undefined!);
	#query = sig<URLSearchParams | undefined>(undefined);

	constructor(options?: HashRouterOptions) {
		const parseEvents = options?.parseEvents ?? ["popstate", "gluon:router:update"];
		for (const name of parseEvents) {
			window.addEventListener(name, this.#parse, { passive: true });
			teardown(() => window.removeEventListener(name, this.#parse));
		}
		this.#parse();
	}

	#parse = () => {
		batch(() => {
			const hash = location.hash.slice(1);
			const queryStart = hash.indexOf("?");
			if (queryStart < 0) {
				this.#path.value = normalizePath(hash);
				this.#query.value = undefined;
			} else {
				this.#path.value = normalizePath(hash.slice(0, queryStart));
				this.#query.value = new URLSearchParams(hash.slice(queryStart + 1));
			}
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
		location.hash = `#${normalizePath(path)}${query === undefined ? "" : new URLSearchParams(query)}`;
	}

	replace(path: string, query?: QueryInit): void {
		this.push(path, query);
	}
}
