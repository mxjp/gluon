import { ContextKey } from "../core/context.js";

/**
 * Represents pending operations in an asynchronously rendered tree.
 */
export class AsyncContext {
	#tasks = new Set<Promise<unknown>>();
	#errors = new Set<unknown[]>();

	/**
	 * Track the specified task in this context.
	 */
	track(task: Promise<unknown>): void {
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
	 * Wait until all tracked tasks in this context have completed.
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