import { ContextKeyFor, extract, inject } from "../core/context.js";

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

export const ROUTER = Symbol.for("gluon:router") as ContextKeyFor<Router>;
