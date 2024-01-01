import { sig } from "../core/signals.js";
import { extract } from "../core/context.js";

export type TaskSource = (() => unknown) | Promise<unknown> | null | undefined;

/**
 * Represents a set of pending tasks in a specific context.
 */
export class Tasks {
	#parent: Tasks | undefined;
	#pending = sig(0);

	/**
	 * Create a new tasks instance with the specified parent.
	 */
	constructor(parent?: Tasks) {
		this.#parent = parent;
	}

	/**
	 * The parent instance or undefined if there is none.
	 */
	get parent(): Tasks | undefined {
		return this.#parent;
	}

	/**
	 * True if this instance has any pending tasks.
	 */
	get selfPending(): boolean {
		return this.#pending.value > 0;
	}

	/**
	 * True if this instance or any of it's parents has any pending tasks.
	 */
	get pending(): boolean {
		return this.#parent?.pending || this.#pending.value > 0;
	}

	/**
	 * Wait for an async function or a promise.
	 *
	 * @param source The async function or promise to wait for.
	 */
	waitFor(source: TaskSource): void {
		if (typeof source === "function") {
			this.#pending.value++;
			(async () => {
				try {
					await source();
				} catch {}
				this.#pending.value--;
			})();
		} else if (source instanceof Promise) {
			this.#pending.value++;
			source.then(() => {
				this.#pending.value--;
			}, () => {
				this.#pending.value--;
			});
		}
	}
}

/**
 * Check if there are any pending tasks in the current tasks instance.
 *
 * This can be used in conjuction with {@link waitFor} to indicate if there are any pending tasks.
 */
export function isSelfPending(): boolean {
	return extract(Tasks)?.selfPending ?? false;
}

/**
 * Check if there are any pending tasks in the current tasks instance or any of it's parents.
 *
 * This can be used in conjunction with {@link waitFor} to disable inputs and buttons while there are any pending tasks.
 */
export function isPending(): boolean {
	return extract(Tasks)?.pending ?? false;
}

/**
 * Use the current tasks instance to wait for an async function or promise.
 *
 * @param source The async function or promise to wait for.
 */
export function waitFor(source: TaskSource): void {
	extract(Tasks)?.waitFor(source);
}
