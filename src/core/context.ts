
/**
 * Utility for phantom typed context key-value pairs.
 *
 * @example
 * ```ts
 * import { ContextKey } from "@mxjp/gluon";
 *
 * const key = Symbol("example") as SymbolFor<"exampleValue">;
 *
 * inject([key, "exampleValue"], () => {
 *   const value = extract(key); // type = "exampleValue"
 * });
 * ```
 */
export type ContextKeyFor<V> = symbol & { PHANTOM_CONTEXT_KEY_FOR: V & never };

/**
 * The value type for a specific type of key.
 */
export type ContextValueFor<K>
	= K extends (new(...args: any) => infer T) ? T
	: K extends ContextKeyFor<infer V> ? V
	: unknown;

/**
 * A key value pair or instance for a specific type of key.
 */
export type ContextPair<K> = K | [K, ContextValueFor<K>];

/**
 * Interface for a context that should not be modified.
 *
 * Note that this is always a {@link Map} instance.
 */
export interface ReadonlyContext {
	get<K>(key: K): ContextValueFor<K> | undefined;
	has(key: unknown): boolean;
	readonly size: number;
}

/**
 * Interface for a context that may be modified.
 *
 * Note that this is always a {@link Map} instance.
 */
export interface Context extends ReadonlyContext {
	clear(): void;
	delete(key: unknown): boolean;
	set<K>(key: K, value: ContextValueFor<K>): void;
}

/**
 * Internal stack where the last item is the current context.
 */
const CONTEXT_STACK: (ReadonlyContext | undefined)[] = [];

/**
 * Get the current context.
 *
 * @returns The current context or undefined if there is no context.
 */
export function getContext(): ReadonlyContext | undefined {
	return CONTEXT_STACK[CONTEXT_STACK.length - 1];
}

/**
 * Get a value from the current context.
 *
 * @param key The key to find.
 * @returns The value or undefined if not found.
 */
export function extract<K>(key: K): ContextValueFor<K> | undefined {
	return getContext()?.get(key);
}

/**
 * Run a function within a copy of the current context that also contains an additional entry.
 *
 * For injecting multiple entries prefer using {@link deriveContext}.
 *
 * @param value The key value pair or instance to inject.
 * @param fn The function to run.
 * @returns The function's return value.
 */
export function inject<K, R>(value: ContextPair<K>, fn: () => R): R {
	const context = new Map(getContext() as Map<any, any>) as Context;
	if (Array.isArray(value)) {
		context.set(value[0], value[1]);
	} else {
		const constructor = (value as any).constructor;
		if (typeof constructor !== "function") {
			throw new TypeError("value must have a constructor");
		}
		context.set(constructor, value);
	}
	return runInContext(context, fn);
}

/**
 * Run a function within a copy of the current context.
 *
 * @param fn The function to run.
 * @returns The function's return value.
 */
export function deriveContext<R>(fn: (context: Context, parent: ReadonlyContext) => R): R {
	const parent = getContext() as Map<any, any>;
	const context = new Map(parent) as Context;
	return runInContext(context, () => fn(context, parent));
}

/**
 * Run a function within the specified or without a context.
 *
 * @param context The context or undefined to use no context.
 * @param fn The function to run.
 * @returns The function's return value.
 */
export function runInContext<R>(context: ReadonlyContext | undefined, fn: () => R): R {
	CONTEXT_STACK.push(context);
	try {
		return fn();
	} finally {
		CONTEXT_STACK.pop();
	}
}

/**
 * Wrap a function to be run with the current context.
 *
 * @param fn The function to wrap.
 * @returns The wrapper.
 */
export function wrapContext<T extends (...args: any) => any>(fn: T): T {
	const context = getContext();
	return ((...args) => {
		CONTEXT_STACK.push(context);
		try {
			return fn(...args);
		} finally {
			CONTEXT_STACK.pop();
		}
	}) as T;
}
