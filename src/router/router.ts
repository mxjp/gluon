import { extract, inject } from "../core/index.js";

export interface Router {
	/**
	 * The root router.
	 */
	get root(): Router;

	/**
	 * The parent of this router if any.
	 */
	get parent(): Router | undefined;

	/**
	 * Get the remaining normalized path in this context.
	 */
	get path(): string;

	/**
	 * The search parameters in this context.
	 */
	get query(): URLSearchParams | undefined;

	push(path: string, query?: QueryInit): void;
	replace(path: string, query?: QueryInit): void;
}

export type QueryInit = ConstructorParameters<typeof URLSearchParams>[0];

const ROUTER = Symbol.for("gluon:router");

export function getRouter(): Router {
	const router = extract(ROUTER) as Router | undefined;
	if (!router) {
		throw new Error("router is not available");
	}
	return router;
}

export function useRouter<T>(router: Router, fn: () => T) {
	return inject([ROUTER, router], fn);
}
