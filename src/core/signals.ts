import { getContext, runInContext } from "./context.js";
import { BATCH_STACK, Dependant, DependantFn, DEPENDANTS_STACK, TRACKING_STACK, TRIGGERS_STACK, useStack } from "./internals.js";
import { captureSelf, nocapture, teardown, TeardownHook, uncapture } from "./lifecycle.js";

/**
 * A function used in signals to determine if the signal should update during a value assignment.
 */
export interface SignalEqualsFn<T> {
	/**
	 * @param previous The previous value.
	 * @param current The current value.
	 * @returns False to update.
	 */
	(previous: T, current: T): boolean;
}

/**
 * Internal utility for capturing dependants.
 *
 * @param stack The stack to capture from.
 * @param map The map to store captured dependants in.
 */
function access(stack: Dependant[][], map: Map<DependantFn, number>): void {
	const top = stack[stack.length - 1];
	for (let i = 0; i < top.length; i++) {
		const [fn, cycle] = top[i];
		map.set(fn, cycle);
	}
}

/**
 * Internal utility for calling a dependant when using forEach on a map of captured dependants.
 *
 * @param cycle The cycle the dependant was captured at.
 * @param fn The dependant to call.
 */
function callDependant(cycle: number, fn: DependantFn) {
	fn(cycle);
}

const SIGNAL_EQUALS_DEFAULT: SignalEqualsFn<unknown> = Object.is;
const SIGNAL_EQUALS_DISABLED: SignalEqualsFn<unknown> = () => false;

/**
 * Represents a value that changes over time.
 */
export class Signal<T> {
	/**
	 * The current value.
	 */
	#value: T;

	/**
	 * * A function to determine if the signal should update during a value assignment.
	 */
	#equals: SignalEqualsFn<T>;

	/**
	 * A map of captured triggers and latest accessed cycles.
	 */
	#triggers = new Map<DependantFn, number>();

	/**
	 * A map of captured dependants and latest accessed cycles.
	 */
	#dependants = new Map<DependantFn, number>();

	/**
	 * Create a new signal.
	 *
	 * @param value The initial value.
	 * @param equals True to skip updates when an assigned value is strictly equal to the previous one or a function to determine of the values are equal. Default is true.
	 */
	constructor(value: T, equals: SignalEqualsFn<T> | boolean = true) {
		this.#value = value;
		this.#equals = typeof equals === "function"
			? equals
			: (equals ? SIGNAL_EQUALS_DEFAULT : SIGNAL_EQUALS_DISABLED);
	}

	/**
	 * Access the current value.
	 */
	get value(): T {
		this.access();
		return this.#value;
	}

	/**
	 * Set the current value.
	 *
	 * @example
	 * ```tsx
	 * import { sig, watch } from "@mxjp/gluon";
	 *
	 * const count = sig(0);
	 *
	 * watch(count, count => {
	 *   console.log("Count:", count);
	 * });
	 *
	 * count.value++;
	 * ```
	 */
	set value(value: T) {
		if (!this.#equals(this.#value, value)) {
			this.#value = value;
			this.notify();
		}
	}

	/**
	 * Update the current value in place.
	 *
	 * @param fn A function to update the value. If false is returned, dependants are not notified.
	 *
	 * @example
	 * ```tsx
	 * import { sig, watch } from "@mxjp/gluon";
	 *
	 * const items = sig([]);
	 *
	 * watch(items, items => {
	 *   console.log("Items:", items);
	 * });
	 *
	 * items.update(items => {
	 *   items.push("foo");
	 *   items.push("bar");
	 * });
	 * ```
	 */
	update(fn: (value: T) => void | boolean): void {
		if (fn(this.#value) !== false) {
			this.notify();
		}
	}

	/**
	 * Check if this signal has any triggers or dependants to notify.
	 *
	 * When this is false, it is guaranteed that updating the value does not result in immediate side effects.
	 */
	get active(): boolean {
		return this.#triggers.size > 0 || this.#dependants.size > 0;
	}

	/**
	 * Manually access this signal.
	 */
	access(): void {
		if (TRACKING_STACK[TRACKING_STACK.length - 1]) {
			access(TRIGGERS_STACK, this.#triggers);
			access(DEPENDANTS_STACK, this.#dependants);
		}
	}

	/**
	 * Manually notify dependants.
	 */
	notify(): void {
		const triggers = this.#triggers;
		this.#triggers = new Map();
		triggers.forEach(callDependant);

		const dependants = this.#dependants;
		if (BATCH_STACK.length > 0) {
			BATCH_STACK[BATCH_STACK.length - 1].push(...dependants);
			dependants.clear();
		} else {
			this.#dependants = new Map();
			dependants.forEach(callDependant);
		}
	}

	/**
	 * Pass this signal to a function and get it's result.
	 *
	 * @example
	 * ```tsx
	 * const value = sig(42);
	 *
	 * <TextInput value={
	 *   value
	 *     .pipe(parseInt)
	 *     .pipe(trim)
	 * } />
	 * ```
	 */
	pipe<A extends any[], R>(fn: (self: this, ...args: A) => R, ...args: A): R {
		return fn(this, ...args);
	}
}

/**
 * Create a new signal.
 *
 * @param value The initial value.
 * @param equals True to skip updates when an assigned value is strictly equal to the previous one or a function to determine if the values are equal. Default is true.
 * @returns The signal.
 */
export function sig(): Signal<void>;
export function sig<T>(value: T, equals?: SignalEqualsFn<T> | boolean): Signal<T>;
export function sig<T>(value?: T, equals?: SignalEqualsFn<T> | boolean): Signal<T> {
	return new Signal<T>(value!, equals);
}

/**
 * A value, signal or function to get a value.
 *
 * @example
 * ```tsx
 * import { sig, watch } from "@mxjp/gluon";
 *
 * const message = sig("Example");
 *
 * // Not reactive:
 * watch(message.value, message => {
 *   console.log("A:", message);
 * });
 *
 * // Reactive:
 * watch(message, message => {
 *   console.log("B:", message);
 * });
 *
 * // Reactive:
 * watch(() => message.value, message => {
 *   console.log("C:", message);
 * });
 *
 * message.value = "Hello World!";
 * ```
 */
export type Expression<T> = T | Signal<T> | (() => T);

/**
 * Type for the result of an expression.
 */
export type ExpressionResult<T> = T extends Expression<infer R> ? R : never;

/**
 * Wrap a dependant function so that recursive side effects run in sequence instead of immediately.
 */
function sequentialize(dependant: DependantFn): DependantFn {
	let queue = 0;
	let cycleOffset = 0;
	return accessedCycle => {
		if (queue < 2) {
			queue++;
		}
		if (queue === 1) {
			try {
				while (queue > 0) {
					dependant(accessedCycle + cycleOffset);
					cycleOffset++;
					queue--;
				}
			} finally {
				queue = 0;
				cycleOffset = 0;
			}
		}
	};
}

/**
 * Internal utility for starting a watch cycle.
 *
 * @param sequential True to wrap the internal dependant using {@link sequentialize}.
 * @param createCycleFn A function to create the cycle function that is called immediately and by the dependant.
 * @param innerFn The inner function that can be called by the cycle function while capturing teardown hooks.
 */
function startCycle(
	sequential: boolean,
	createCycleFn: (
		dependant: Dependant,
		innerFn: (disposeSelf: TeardownHook) => void,
		dispose: () => void,
	) => (() => void),
	innerFn: () => void,
) {
	const context = getContext();
	let disposed = false;
	let disposeFn: TeardownHook | undefined;

	teardown(() => {
		disposed = true;
		disposeFn?.();
	});

	let dependantFn = (accessedCycle: number): void => {
		if (!disposed && dependant[1] === accessedCycle) {
			dependant[1] = (dependant[1] + 1) | 0;
			runInContext(context, cycleFn);
		}
	};
	if (sequential) {
		dependantFn = sequentialize(dependantFn);
	}

	const dependant: Dependant = [dependantFn, 0];

	const captureInnerFn = (disposeSelf: TeardownHook) => {
		disposeFn = disposeSelf;
		innerFn();
	};

	const cycleFn = createCycleFn(
		dependant,
		captureInnerFn,
		() => disposeFn?.(),
	);

	dependantFn(0);
}

/**
 * Watch an expression until the current lifecycle is disposed.
 *
 * @param expr The expression to watch.
 * @param fn The function to call with the expression result. This is guaranteed to be called at least once immediately. Lifecycle hooks are called before the next function call or when the current lifecycle is disposed.
 * @param sequential If true, recursive side effects run in sequence instead of immediately. Default is false.
 *
 * @example
 * ```tsx
 * import { sig, watch } from "@mxjp/gluon";
 *
 * const count = sig(0);
 *
 * // Capture teardown hooks registered by "watch":
 * const dispose = capture(() => {
 *   // Start watching:
 *   watch(count, count => {
 *     console.log("Count:", count);
 *   });
 * });
 *
 * count.value = 1;
 *
 * // Stop watching:
 * dispose();
 *
 * count.value = 2;
 * ```
 */
export function watch<T>(expr: Expression<T>, fn: (value: T) => void, sequential = false): void {
	if (expr instanceof Signal || typeof expr === "function") {
		let value: T;
		const runExpr = expr instanceof Signal
			? () => value = expr.value
			: () => value = nocapture(expr as () => T);
		startCycle(
			sequential,
			(dependant, innerFn, dispose) => () => {
				TRIGGERS_STACK.push([]);
				DEPENDANTS_STACK.push([dependant]);
				try {
					runExpr();
				} finally {
					TRIGGERS_STACK.pop();
					DEPENDANTS_STACK.pop();
				}
				dispose();
				captureSelf(innerFn);
			},
			() => fn(value),
		);
	} else {
		fn(expr);
	}
}

/**
 * Watch an expression until the current lifecycle is disposed.
 *
 * @param expr The expression to watch.
 * @param fn The function to call with the expression result when any updates occur.
 * @param sequential If true, recursive side effects run in sequence instead of immediately. Default is false.
 * @returns The first expression result.
 */
export function watchUpdates<T>(expr: Expression<T>, fn: (value: T) => void, sequential?: boolean): T {
	let first: T;
	let update = false;
	watch(expr, value => {
		if (update) {
			fn(value);
		} else {
			first = value;
			update = true;
		}
	}, sequential);
	return first!;
}

/**
 * Run and watch a function until the current lifecycle is disposed.
 *
 * Note, that this doesn't separate signal accesses from side effects which makes it easier to accidentally cause infinite loops. If possible, use {@link watch} or {@link watchUpdates} instead.
 *
 * @param fn The function to run. Lifecycle hooks  are called before the next function call or when the current lifecycle is disposed.
 * @param sequential If true, recursive side effects run in sequence instead of immediately. Default is false.
 */
export function effect(fn: () => void, sequential = false): void {
	startCycle(
		sequential,
		(dependant, innerFn, dispose) => () => {
			dispose();
			TRIGGERS_STACK.push([]);
			DEPENDANTS_STACK.push([dependant]);
			try {
				captureSelf(innerFn);
			} finally {
				TRIGGERS_STACK.pop();
				DEPENDANTS_STACK.pop();
			}
		},
		fn,
	);
}

/**
 * Evaluate an expression and call a function once when any accessed signals are updated.
 *
 * It is guaranteed that all triggers are called before other non-trigger dependants per signal update or batch.
 *
 * @param expr The expression evaluate.
 * @param fn The function to call when any accessed signals are updated.
 * @param cycle An arbitrary number to pass back to the function.
 *
 * @example
 * ```tsx
 * import { sig, trigger } from "@mxjp/gluon";
 *
 * const count = sig(0);
 *
 * console.log("Count:", trigger(count, cycle => {
 *   console.log("Count is being updated:", cycle);
 * }, 42));
 *
 * count.value++;
 * ```
 */
export function trigger<T>(expr: Expression<T>, fn: (cycle: number) => void, cycle = 0): T {
	if (expr instanceof Signal || typeof expr === "function") {
		const triggers = TRIGGERS_STACK[TRIGGERS_STACK.length - 1];
		triggers.push([cycle => uncapture(() => fn(cycle)), cycle]);
		try {
			if (expr instanceof Signal) {
				return expr.value;
			}
			return (expr as () => T)();
		} finally {
			triggers.pop();
		}
	} else {
		return expr;
	}
}

/**
 * Defer signal updates while calling a function and process them immediately after all current batches have finished.
 *
 * + When nesting batches, updates are processed after the most outer batch has completed.
 * + Updates are also processed if an error is thrown by the specified function.
 *
 * @param fn The function to run.
 * @returns The function's return value.
 *
 * @example
 * The example below outputs `5` and `9` once. Without batching the output would be `5, 7, 9`.
 * ```tsx
 * import { batch, sig, watch } from "@mxjp/gluon";
 *
 * const a = sig(2);
 * const b = sig(3);
 *
 * watch(() => a.value + b.value, value => {
 *   console.log("Sum:", value);
 * });
 *
 * batch(() => {
 *   a.value = 4;
 *   b.value = 5;
 * });
 * ```
 */
export function batch<T>(fn: () => T): T {
	if (BATCH_STACK.length > 0) {
		return fn();
	}
	const deps: Dependant[] = [];
	try {
		BATCH_STACK.push(deps);
		return fn();
	} finally {
		BATCH_STACK.pop();
		for (let i = 0; i < deps.length; i++) {
			const [fn, cycle] = deps[i];
			fn(cycle);
		}
	}
}

/**
 * Watch an expression and create a function to reactively access it's latest result.
 *
 * This is similar to {@link lazy}, but the expression is always evaluated and then updates it's dependants.
 *
 * @param expr The expression to watch.
 * @param equals True to skip updates when a result is strictly equal to the previous one or a function to determine if the results are equal. Default is true.
 * @returns A function to access the latest result.
 *
 * @example
 * ```tsx
 * import { sig, memo, watch } from "@mxjp/gluon";
 *
 * const count = sig(42);
 *
 * const computed = memo(() => someExpensiveComputation(count.value));
 *
 * watch(computed, count => {
 *   console.log("Count:", count);
 * });
 * ```
 */
export function memo<T>(expr: Expression<T>, equals?: SignalEqualsFn<T> | boolean): () => T {
	const signal = sig<T>(undefined!, equals);
	watch(expr, value => signal.value = value);
	return () => signal.value;
}

/**
 * Wrap an expression to be evaulated only when any of the accessed signals have been updated.
 *
 * This is similar to {@link memo}, but the expression is only evaulated if it is actually used.
 *
 * @param expr The expression to wrap.
 * @returns A function to lazily evaluate the expression.
 *
 * @example
 * ```tsx
 * import { sig, lazy, watch } from "@mxjp/gluon";
 *
 * const count = sig(42);
 *
 * const computed = lazy(() => someExpensiveComputation(count.value));
 *
 * watch(computed, count => {
 *   console.log("Count:", count);
 * });
 * ```
 */
export function lazy<T>(expr: Expression<T>): () => T {
	let value: T;
	let current = false;

	let proxyMap = new Map<DependantFn, number>();
	const proxy: Dependant = [accessedCycle => {
		if (proxy[1] === accessedCycle) {
			proxy[1] = (proxy[1] + 1) | 0;
			const map = proxyMap;
			proxyMap = new Map();
			map.forEach(callDependant);
		}
	}, 0];

	const triggerFn = (accessedCycle: number) => {
		if (cycle === accessedCycle) {
			cycle = (cycle + 1) | 0;
			current = false;
		}
	};

	let cycle = 0;
	return () => {
		access(DEPENDANTS_STACK, proxyMap);
		if (!current) {
			current = true;
			DEPENDANTS_STACK.push([proxy]);
			try {
				value = trigger(expr, triggerFn, cycle);
			} finally {
				DEPENDANTS_STACK.pop();
			}
		}
		return value;
	};
}

/**
 * Run a function while not tracking signal accesses.
 *
 * This is the opposite of {@link track}.
 *
 * @param fn The function to run.
 * @returns The function's return value.
 *
 * @example
 * ```tsx
 * import { sig, untrack, watch } from "@mxjp/gluon";
 *
 * const a = sig(2);
 * const b = sig(3);
 *
 * watch(() => a.value + untrack(() => b.value), sum => {
 *   console.log("Sum:", sum);
 * });
 *
 * a.value = 4;
 * b.value = 5;
 * ```
 */
export function untrack<T>(fn: () => T): T {
	return useStack(TRACKING_STACK, false, fn);
}

/**
 * Run a function while tracking signal accesses. This is the default behavior.
 *
 * This is the opposite of {@link untrack}.
 *
 * @param fn The function to run.
 * @returns The function's return value.
 */
export function track<T>(fn: () => T): T {
	return useStack(TRACKING_STACK, true, fn);
}

/**
 * Check if an expression is currently evaluated to track signal accesses.
 */
export function isTracking(): boolean {
	return TRACKING_STACK[TRACKING_STACK.length - 1]
		&& (TRIGGERS_STACK[TRIGGERS_STACK.length - 1].length > 0 || DEPENDANTS_STACK[DEPENDANTS_STACK.length - 1].length > 0);
}

/**
 * Evaulate an expression.
 *
 * This can be used to access reactive and non reactive inputs.
 *
 * @param expr The expression to evaluate.
 * @returns The expression result.
 *
 * @example
 * ```tsx
 * import { sig, get } from "@mxjp/gluon";
 *
 * const count = sig(42);
 *
 * get(42) // 42
 * get(count) // 42
 * get(() => 42) // 42
 * ```
 */
export function get<T>(expr: Expression<T>): T {
	if (expr instanceof Signal) {
		return expr.value;
	}
	if (typeof expr === "function") {
		return (expr as () => T)();
	}
	return expr;
}

export type MapFn<I, O> = (input: I) => O;

/**
 * Map an expression value while preserving if the expression is static or not.
 *
 * @example
 * ```tsx
 * import { sig, map, get } from "@mxjp/gluon";
 *
 * const count = sig(42);
 * const doubleCount = map(count, value => value * 2);
 *
 * get(doubleCount) // 84
 * ```
 */
export function map<I, O>(input: Expression<I>, mapFn: MapFn<I, O>): Expression<O> {
	if (input instanceof Signal) {
		return () => mapFn(input.value);
	}
	if (typeof input === "function") {
		return () => mapFn((input as () => I)());
	}
	return mapFn(input);
}

/**
 * Map an expression value to strings.
 *
 * See {@link map}.
 *
 * @example
 * ```tsx
 * import { string } from "@mxjp/gluon";
 *
 * <div some-value={string(true)} />; // <div some-value="true" />
 * <div some-value={string(false)} />; // <div some-value="false" />
 * <div some-value={string(null)} />; // <div some-value="null" />
 * ```
 */
export function string(input: Expression<unknown>): Expression<string> {
	return map(input, value => String(value));
}

/**
 * Map an expression value to strings unless it's null or undefined.
 *
 * See {@link map}.
 *
 * @example
 * ```tsx
 * import { optionalString } from "@mxjp/gluon";
 *
 * <div some-value={optionalString(false)} />; // <div some-value="false" />
 * <div some-value={optionalString(null)} />; // <div />
 * ```
 */
export function optionalString<T>(input: Expression<T>): Expression<string | Exclude<T, Exclude<T, null | undefined>>> {
	return map<T, unknown>(input, value => {
		if (value === null || value === undefined) {
			return value;
		}
		return String(value);
	}) as Expression<string | Exclude<T, Exclude<T, null | undefined>>>;
}
