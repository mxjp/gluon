import { createReactiveArrayProxy } from "./reactive-array-proxy.js";
import { ReactiveMap } from "./reactive-map.js";
import { createReactiveProxy } from "./reactive-proxy.js";
import { ReactiveSet } from "./reactive-set.js";

/**
 * An object that is used to convert between reactive wrappers and their targets.
 */
export interface Barrier {
	/**
	 * Get a reactive wrapper for the specified value.
	 *
	 * This should always return the same wrapper for the same value.
	 *
	 * @param value The target.
	 * @returns The wrapper or the value itself if it was already wrapped.
	 */
	wrap<T>(value: T): T;

	/**
	 * Get the target for the specified reactive wrapper.
	 *
	 * This should always return the same target for the same value.
	 *
	 * @param value The wrapper or a non-wrapped value.
	 * @returns The target or the value itself if it was already unwrapped.
	 */
	unwrap<T>(value: T): T;
}

/**
 * Symbol for storing functions for wrapping an instance on it's constructor.
 */
const WRAP_INSTANCE = Symbol.for("gluon:store:wrap_instance");

/**
 * A map of targets to wrappers.
 */
const WRAPPERS = new WeakMap<object, object>();

/**
 * A map of wrappers to targets.
 */
const TARGETS = new WeakMap<object, object>();

export interface WrapInstanceFn<T> {
	(instance: T): T;
}

const STORE: Barrier = { wrap, unwrap };

/**
 * Get a deep reactive wrapper for the specified value.
 *
 * This always returns the same wrapper for the same value.
 *
 * @param value The value to wrap.
 * @returns The wrapper or the value itself if it was already wrapped.
 */
export function wrap<T>(value: T): T {
	if (value !== null && typeof value === "object") {
		if (TARGETS.has(value)) {
			return value;
		}

		let wrapper = WRAPPERS.get(value) as T | undefined;
		if (wrapper !== undefined) {
			return wrapper as T;
		}

		const ctor = value.constructor;
		const wrapInstance = (ctor as unknown as { [WRAP_INSTANCE]: WrapInstanceFn<T> })[WRAP_INSTANCE];
		if (wrapInstance) {
			wrapper = wrapInstance(value);
		} else {
			switch (ctor) {
				case null:
				case undefined:
				case Object:
					wrapper = createReactiveProxy(value, STORE);
					break;

				case Array:
					wrapper = createReactiveArrayProxy(value as unknown[], STORE) as T;
					break;

				case Map:
					wrapper = new ReactiveMap(value as unknown as Map<unknown, unknown>, STORE) as T;
					break;

				case Set:
					wrapper = new ReactiveSet(value as unknown as Set<unknown>, STORE) as T;
					break;

				default: return value;
			}
		}

		WRAPPERS.set(value, wrapper!);
		TARGETS.set(wrapper!, value);
		return wrapper as T;
	}
	return value;
}

/**
 * Get the target for a reactive wrapper.
 *
 * This always returns the same target for the same value.
 *
 * @param value The value to unwrap.
 * @returns The target or the value itself if it was already unwrapped.
 */
export function unwrap<T>(value: T): T {
	if (value !== null && typeof value === "object") {
		const target = TARGETS.get(value);
		if (target !== undefined) {
			return target as T;
		}
	}
	return value;
}

function defaultWrapInstance<T extends object>(value: T): T {
	return createReactiveProxy(value, STORE);
}

/**
 * Allow instances of the specified target class to be wrapped.
 *
 * @param targetClass The target class.
 * @param wrap A function to wrap an instance. By default `createReactiveProxy` is used with `wrap` and `unwrap` for inner values.
 *
 * @example
 * ```tsx
 * class Example {
 *   static {
 *     // Using the default "createReactiveProxy":
 *     wrapInstancesOf(this);
 *
 *     // Or a custom wrapper:
 *     wrapInstancesOf(this, instance => {
 *       return createSomeWrapperFor(instance);
 *     });
 *   }
 * }
 * ```
 */
export function wrapInstancesOf<T extends object>(targetClass: new(...args: any) => T, wrap?: (instance: T) => T): void {
	Object.defineProperty(targetClass, WRAP_INSTANCE, {
		configurable: true,
		enumerable: false,
		writable: false,
		value: wrap ?? defaultWrapInstance,
	});
}
