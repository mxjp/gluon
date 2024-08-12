import { isTracking, Signal, SignalEqualsFn } from "../core/signals.js";

/**
 * A signal for tracking accesses to values that may not exist.
 */
export class ProbeSignal<T> extends Signal<T> {
	#onDisposable: () => void;

	/**
	 * Create a new probe signal.
	 *
	 * @param onDisposable A function to call when it is guaranteed that this signal is no longer watched.
	 * @param value The initial value.
	 * @param equals True to skip updates when an assigned value is strictly equal to the previous one or a function to determine of the values are equal. Default is true.
	 */
	constructor(onDisposable: () => void, value: T, equals?: boolean | SignalEqualsFn<T>) {
		super(value, equals);
		this.#onDisposable = onDisposable;
	}

	notify(): void {
		super.notify();
		if (!this.active) {
			this.#onDisposable();
		}
	}
}

/**
 * A map for tracking keyed accesses to values that may not exist.
 */
export class ProbeMap<K, V> {
	#probes = new Map<K, ProbeSignal<V>>();
	#get: (key: K) => V;

	/**
	 * Create a new probe map.
	 *
	 * @param get A function to get the current value for a key at any time.
	 */
	constructor(get: (key: K) => V) {
		this.#get = get;
	}

	/**
	 * Access the specified key.
	 *
	 * If an expression is currently evaluated to track signal accesses, this will create and access a probe signal for the specified key. That probe signal is automatically removed when it is guaranteed that this key is no longer watched.
	 */
	access(key: K): void {
		if (isTracking()) {
			let probe = this.#probes.get(key);
			if (probe === undefined) {
				probe = new ProbeSignal(() => this.#probes.delete(key), this.#get(key));
				this.#probes.set(key, probe);
			}
			probe.access();
		}
	}

	/**
	 * Update a key-value pair and notify it's dependants.
	 */
	update(key: K, value: V): void {
		const probe = this.#probes.get(key);
		if (probe !== undefined) {
			probe.value = value;
		}
	}

	/**
	 * Set the value of all existing probe signals in this map.
	 */
	fill(value: V): void {
		for (const probe of this.#probes.values()) {
			probe.value = value;
		}
	}
}
