import { ContextKey, extract } from "../core/context.js";
import { teardown } from "../core/lifecycle.js";
import { sig, watch } from "../core/signals.js";

export type TaskSource = (() => unknown) | Promise<unknown> | null | undefined;

export interface TasksOptions {
	/**
	 * If true, focus is restored on the last active element when there are no more pending tasks in this instance.
	 *
	 * By default, this is inherited from the parent or true of there is none.
	 */
	restoreFocus?: boolean;
}

/**
 * Represents a set of pending tasks in a specific context.
 *
 * This is meant to be used for preventing concurrent user interaction in a specific context.
 */
export class Tasks {
	#pendingCount = 0;
	#pending = sig(false);
	#restoreFocus: boolean;
	#parent: Tasks | undefined;

	/**
	 * Create a new tasks instance with the specified parent.
	 *
	 * @param parent The parent to use. Default is no parent.
	 */
	constructor(parent?: Tasks, options?: TasksOptions) {
		this.#parent = parent;
		this.#restoreFocus = options?.restoreFocus ?? (parent ? parent.#restoreFocus : true);

		if (this.#restoreFocus) {
			let last: Element | null = null;
			watch(this.#pending, pending => {
				if (pending) {
					last = document.activeElement;
				} else if (last && document.activeElement === document.body) {
					const target = last;
					queueMicrotask(() => {
						if (last === target && document.activeElement === document.body) {
							(target as HTMLElement).focus?.();
						}
					});
				}
			});
		}
	}

	#setPending(): void {
		this.#pendingCount++;
		this.#pending.value = true;
	}

	#unsetPending(): void {
		this.#pendingCount--;
		this.#pending.value = this.#pendingCount > 0;
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
		return this.#pending.value;
	}

	/**
	 * True if this instance or any of it's parents has any pending tasks.
	 */
	get pending(): boolean {
		return (this.#parent?.pending ?? false) || this.#pending.value;
	}

	/**
	 * Pretend, that there is a pending task until the current context is disposed.
	 */
	setPending(): void {
		this.#setPending();
		let disposed = false;
		teardown(() => {
			if (!disposed) {
				disposed = true;
				this.#unsetPending();
			}
		});
	}

	/**
	 * Wait for an async function or a promise.
	 *
	 * @param source The async function or promise to wait for.
	 */
	waitFor(source: TaskSource): void {
		if (typeof source === "function") {
			this.#setPending();
			void (async () => {
				try {
					return await source();
				} catch {}
				this.#unsetPending();
			})();
		} else if (source instanceof Promise) {
			this.#setPending();
			void source.then(() => {
				this.#unsetPending();
			}, () => {
				this.#unsetPending();
			});
		}
	}

	/**
	 * Create a new tasks instance using the {@link extract current} instance as parent.
	 */
	static fork(options?: TasksOptions): Tasks {
		return new Tasks(extract(TASKS), options);
	}
}

/**
 * Context key for the current {@link Tasks} instance.
 */
export const TASKS = Symbol.for("gluon:tasks") as ContextKey<Tasks>;

/**
 * Check if there are any pending tasks in the current tasks instance.
 *
 * This can be used in conjuction with {@link waitFor} to indicate if there are any pending tasks.
 *
 * This is meant to be used for preventing concurrent user interaction in a specific context.
 */
export function isSelfPending(): boolean {
	return extract(TASKS)?.selfPending ?? false;
}

/**
 * Check if there are any pending tasks in the current tasks instance or any of it's parents.
 *
 * This can be used in conjunction with {@link waitFor} to disable inputs and buttons while there are any pending tasks.
 *
 * This is meant to be used for preventing concurrent user interaction in a specific context.
 */
export function isPending(): boolean {
	return extract(TASKS)?.pending ?? false;
}

/**
 * Pretend, that there is a pending task in the current tasks instance until the current context is disposed.
 *
 * This is meant to be used for preventing concurrent user interaction in a specific context.
 *
 * @example
 * ```tsx
 * import { inject, TASKS, Tasks, capture, setPending, isPending } from "@mxjp/gluon";
 *
 * inject(TASKS, new Tasks(), () => {
 *   isPending(); // => false
 *   const stop = capture(setPending);
 *   isPending(); // => true
 *   stop();
 *   isPending(); // => false
 * });
 * ```
 */
export function setPending(): void {
	extract(TASKS)?.setPending();
}

/**
 * Use the current tasks instance to wait for an async function or promise.
 *
 * This is meant to be used for preventing concurrent user interaction in a specific context.
 *
 * @param source The async function or promise to wait for.
 */
export function waitFor(source: TaskSource): void {
	extract(TASKS)?.waitFor(source);
}
