import { isTracking, Signal, SignalEqualsFn } from "../core/signals.js";

export class ProbeSignal<T> extends Signal<T> {
	#onDisposable: () => void;

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

export class ProbeMap<K, V> {
	#probes = new Map<K, ProbeSignal<V>>();
	#get: (key: K) => V;

	constructor(get: (key: K) => V) {
		this.#get = get;
	}

	access(key: K): void {
		if (isTracking()) {
			let probe = this.#probes.get(key);
			if (probe === undefined) {
				probe = new ProbeSignal(() => {
					this.#probes.delete(key);
				}, this.#get(key));
				this.#probes.set(key, probe);
			}
			probe.access();
		}
	}

	update(key: K, value: V): void {
		const probe = this.#probes.get(key);
		if (probe !== undefined) {
			probe.value = value;
		}
	}

	fill(value: V): void {
		for (const probe of this.#probes.values()) {
			probe.value = value;
		}
	}
}
