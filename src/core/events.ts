import { teardown } from "./lifecycle.js";

export interface EventFn<T extends unknown[]> {
	(...args: T): void;
}

export interface Event<T extends unknown[]> {
	/**
	 * Subscribe to this event until the current lifecycle is disposed.
	 */
	(listener: EventFn<T>): void;
}

export class Emitter<T extends unknown[]> {
	#listeners = new Set<EventFn<T>>();

	/**
	 * Subscribe to this event until the current lifecycle is disposed.
	 */
	event: Event<T> = listener => {
		this.#listeners.add(listener);
		teardown(() => {
			this.#listeners.delete(listener);
		});
	};

	/**
	 * Emit this event.
	 */
	emit(...args: T): void {
		this.#listeners.forEach(fn => fn(...args));
	}
}
