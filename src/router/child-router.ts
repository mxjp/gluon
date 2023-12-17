import { Expression, get } from "../core/signals.js";
import { join } from "./path.js";
import { QueryInit, Router } from "./router.js";

export class ChildRouter implements Router {
	#parent: Router;
	#mountPath: string;
	#path: Expression<string>;

	constructor(parent: Router, mountPath: string, path: Expression<string>) {
		this.#parent = parent;
		this.#mountPath = mountPath;
		this.#path = path;
	}

	get root(): Router {
		return this.#parent.root;
	}

	get parent(): Router | undefined {
		return this.#parent;
	}

	get path(): string {
		return get(this.#path);
	}

	get query(): URLSearchParams | undefined {
		return this.#parent.query;
	}

	push(path: string, query?: QueryInit): void {
		this.#parent.push(join(this.#mountPath, path), query);
	}

	replace(path: string, query?: QueryInit): void {
		this.#parent.replace(join(this.#mountPath, path), query);
	}
}
