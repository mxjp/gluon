import { batch, sig } from "../core/signals.js";
import { normalize } from "./path.js";
import { QueryInit, Router } from "./router.js";

export interface MemoryRouterOptions {
	/**
	 * The initial path.
	 */
	path?: string;

	/**
	 * The initial query.
	 */
	query?: QueryInit;
}

/**
 * A router that keeps it's state in memory instead of the actual browser location.
 */
export class MemoryRouter implements Router {
	#path = sig<string>(undefined!);
	#query = sig<URLSearchParams | undefined>(undefined);

	constructor(options?: MemoryRouterOptions) {
		this.#path.value = normalize(options?.path ?? "");
		this.#query.value = options?.query ? new URLSearchParams(options.query) : undefined;
	}

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
		batch(() => {
			this.#path.value = normalize(path);
			this.#query.value = query ? new URLSearchParams(query) : undefined;
		});
	}

	replace(path: string, query?: QueryInit): void {
		this.push(path, query);
	}
}
