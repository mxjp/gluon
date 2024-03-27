import { batch, sig, Signal } from "../core/signals.js";
import type { Barrier } from "./barrier.js";
import { ProbeMap } from "./probes.js";

/**
 * A reactive wrapper for a set.
 */
export class ReactiveSet<T> implements Set<T> {
	#target: Set<T>;
	#barrier: Barrier;
	#size: Signal<number>;
	#iterators: Signal<void>;
	#probes: ProbeMap<T, boolean>;

	constructor(target: Set<T>, barrier: Barrier) {
		this.#target = target;
		this.#barrier = barrier;
		this.#size = sig(target.size);
		this.#iterators = sig();
		this.#probes = new ProbeMap(key => target.has(key));
	}

	get size(): number {
		this.#size.access();
		return this.#target.size;
	}

	has(value: T): boolean {
		value = this.#barrier.unwrap(value);
		this.#probes.access(value);
		return this.#target.has(value);
	}

	add(value: T): this {
		batch(() => {
			value = this.#barrier.unwrap(value);
			this.#target.add(value);
			this.#size.value = this.#target.size;
			this.#iterators.notify();
			this.#probes.update(value, true);
		});
		return this;
	}

	delete(value: T): boolean {
		return batch(() => {
			value = this.#barrier.unwrap(value);
			const deleted = this.#target.delete(value);
			if (deleted) {
				this.#size.value = this.#target.size;
				this.#iterators.notify();
				this.#probes.update(value, false);
			}
			return deleted;
		});
	}

	clear(): void {
		batch(() => {
			this.#target.clear();
			this.#size.value = 0;
			this.#iterators.notify();
			this.#probes.fill(false);
		});
	}

	* entries(): IterableIterator<[T, T]> {
		this.#iterators.access();
		for (const entry of this.#target.entries()) {
			const value = this.#barrier.wrap(entry[0]);
			yield [value, value];
		}
	}

	* keys(): IterableIterator<T> {
		this.#iterators.access();
		for (const key of this.#target.keys()) {
			yield this.#barrier.wrap(key);
		}
	}

	* values(): IterableIterator<T> {
		this.#iterators.access();
		for (const value of this.#target.values()) {
			yield this.#barrier.wrap(value);
		}
	}

	forEach(callback: (value: T, value2: T, set: Set<T>) => void, thisArg?: unknown): void {
		this.#iterators.access();
		return this.#target.forEach(value => {
			value = this.#barrier.wrap(value);
			callback.call(thisArg, value, value, this);
		}, thisArg);
	}

	* [Symbol.iterator](): IterableIterator<T> {
		this.#iterators.access();
		for (const value of this.#target) {
			yield this.#barrier.wrap(value);
		}
	}

	get [Symbol.toStringTag](): string {
		return this.#target[Symbol.toStringTag];
	}
}
