import { batch, sig } from "@mxjp/gluon";
import { normalize, QueryInit, Router } from "@mxjp/gluon/router";

export class TestRouter implements Router {
	#events: unknown[];
	#path = sig(normalize(""));
	#query = sig<URLSearchParams | undefined>(undefined);

	constructor(events?: unknown[]) {
		this.#events = events ?? [];
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

	#push(path: string, query?: QueryInit): void {
		batch(() => {
			this.#path.value = normalize(path);
			this.#query.value = query ? new URLSearchParams(query) : undefined;
		});
	}

	push(path: string, query?: QueryInit): void {
		this.#events.push(["push", path, query]);
		this.#push(path, query);
	}

	replace(path: string, query?: QueryInit): void {
		this.#events.push(["replace", path, query]);
		this.#push(path, query);
	}
}
