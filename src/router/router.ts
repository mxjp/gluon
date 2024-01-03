import { ContextKeyFor } from "../core/context.js";

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

	/**
	 * Navigate to the specified path within the path this router is mounted in.
	 *
	 * @param path The path. This may not be normalized.
	 * @param query The query part.
	 */
	push(path: string, query?: QueryInit): void;

	/**
	 * Same as {@link push}, but replaces the URL in history if possible.
	 */
	replace(path: string, query?: QueryInit): void;
}

export type QueryInit = ConstructorParameters<typeof URLSearchParams>[0];

export const ROUTER = Symbol.for("gluon:router") as ContextKeyFor<Router>;
