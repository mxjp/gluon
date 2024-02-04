import { ContextKey, extract } from "../core/context.js";

/**
 * Represents pending operations in an asynchronously rendered tree.
 *
 * This can be used to wait until an entire async tree is rendered or to check if any errors occurred.
 */
export class AsyncContext {
	#parent: AsyncContext | undefined;
	#tasks = new Set<Promise<unknown>>();
	#errors = new Set<unknown[]>();

	constructor(parent?: AsyncContext) {
		this.#parent = parent;
	}

	/**
	 * Track the specified task in this and all parent contexts.
	 */
	track(task: Promise<unknown>): void {
		this.#parent?.track(task);
		this.#tasks.add(task);
		task.then(() => {
			this.#tasks.delete(task);
		}, error => {
			for (const errors of this.#errors) {
				errors.push(error);
			}
			this.#tasks.delete(task);
		});
	}

	/**
	 * Wait until all tracked tasks in this and all child contexts have completed.
	 *
	 * This also includes new tasks that are tracked while waiting.
	 *
	 * @throws Errors thrown by any tracked task or an {@link AsyncError} if multiple tasks failed.
	 */
	async complete(): Promise<void> {
		const errors: unknown[] = [];
		this.#errors.add(errors);
		while (this.#tasks.size > 0) {
			await Promise.allSettled(this.#tasks);
		}
		this.#errors.delete(errors);
		if (errors.length === 1) {
			throw errors[0];
		} else if (errors.length > 1) {
			throw new AsyncError(errors);
		}
	}

	/**
	 * Create a new async context using the {@link extract current} context as parent.
	 */
	static fork(): AsyncContext {
		return new AsyncContext(extract(ASYNC));
	}
}

export class AsyncError extends Error {
	errors: unknown[];

	constructor(errors: unknown[]) {
		super();
		this.errors = errors;
	}
}

/**
 * Context key for the current {@link AsyncContext}.
 */
export const ASYNC = Symbol.for("gluon:async") as ContextKey<AsyncContext>;
