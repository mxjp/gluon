import { sharedGlobal } from "../core/globals.js";
import { ReactiveMap } from "./reactive-map.js";
import { createReactiveProxy } from "./reactive-proxy.js";
import { ReactiveSet } from "./reactive-set.js";

/**
 * An object that is used to convert between reactive wrappers and their targets.
 */
export interface Converter {
	/**
	 * Get an reactive wrapper for the specified value.
	 */
	wrap<T>(value: T): T;

	/**
	 * Get the target for the specified reactive wrapper.
	 */
	unwrap<T>(value: T): T;
}

const WRAP_INSTANCE = Symbol.for("gluon:store:wrap_instance");
const WRAPPERS = sharedGlobal("gluon:store:wrappers", () => new WeakMap<object, object>());
const TARGETS = sharedGlobal("gluon:store:targets", () => new WeakMap<object, object>());

export interface WrapInstanceFn<T> {
	(instance: T): T;
}

export const STORE: Converter = { wrap, unwrap };

/**
 * Get a deep reactive wrapper for the specified value.
 */
export function wrap<T>(value: T): T {
	if (value !== null && typeof value === "object") {
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
				case Object:
					wrapper = createReactiveProxy(value, STORE);
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

export function wrapInstancesOf<T extends object>(targetClass: new(...args: any) => T, wrap?: (instance: T) => T): void {
	Object.defineProperty(targetClass, WRAP_INSTANCE, {
		configurable: true,
		enumerable: false,
		writable: false,
		value: wrap ?? defaultWrapInstance,
	});
}
