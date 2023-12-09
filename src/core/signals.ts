import { getContext, runInContext } from "./context.js";
import { TeardownHook, capture, teardown, uncapture } from "./lifecycle.js";

/**
 * A function that is stored inside any accessed signals alongside a cycle.
 */
interface DependantFn {
	(cycle: number): void;
}

/**
 * A pair of dependant function and the cycle it was captured at.
 */
type Dependant = [fn: DependantFn, cycle: number];

/**
 * Internal stack where the last item is the current batch. This may be empty.
 */
const BATCH_STACK: Dependant[][] = [];

/**
 * Internal stack where the last item indicates if signal access is currently tracked. This is never empty.
 */
const TRACKING_STACK: boolean[] = [true];

/**
 * Internal stack where the last item is an array of triggers to capture in any accessed signals.
 */
const TRIGGERS_STACK: Dependant[][] = [[]];

/**
 * Internal stack where the last item is an array of dependants to capture in any accessed signals.
 */
const DEPENDANTS_STACK: Dependant[][] = [[]];

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
 * Internal utility for notifying captured dependants.
 *
 * @param top An array of captured dependants.
 */
function notify(top: Dependant[]): void {
	for (let i = 0; i < top.length; i++) {
		const [fn, cycle] = top[i];
		fn(cycle);
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
			: (equals ? (a, b) => a === b : () => false);
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
}

/**
 * Create a new signal.
 *
 * @param value The initial value.
 * @param equals True to skip updates when an assigned value is strictly equal to the previous one or a function to determine if the values are equal. Default is true.
 * @returns The signal.
 */
export function sig<T>(value: T, equals?: SignalEqualsFn<T> | boolean): Signal<T> {
	return new Signal(value, equals);
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
 * Watch an expression until the current context is disposed.
 *
 * @param expr The expression to watch.
 * @param fn The function to call with the expression result. This is guaranteed to be called at least once immediately.
 * @param trigger If true, {@link batch batches} are ignored and the callback is guaranteed to be called before all other non-trigger callbacks. This can be used to implement computations that can run during batches.
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
export function watch<T>(expr: Expression<T>, fn: (value: T) => void, trigger = false): void {
	if (expr instanceof Signal || typeof expr === "function") {
		const context = getContext();
		let disposed = false;
		let disposeFn: TeardownHook | undefined;
		let cycle = 0;

		let value: T;
		let runExpr: () => void;
		if (expr instanceof Signal) {
			runExpr = () => {
				value = expr.value;
			};
		} else {
			runExpr = () => {
				value = (expr as () => T)();
			};
		}

		const runFn = () => fn(value);

		(function dependant(accessedCycle: number): void {
			if (disposed || cycle !== accessedCycle) {
				return;
			}
			cycle++;
			runInContext(context, () => {
				const dependants: Dependant[] = [[dependant, cycle]];
				TRIGGERS_STACK.push(trigger ? dependants : []);
				DEPENDANTS_STACK.push(trigger ? [] : dependants);
				try {
					uncapture(runExpr);
				} finally {
					TRIGGERS_STACK.pop();
					DEPENDANTS_STACK.pop();
				}
				disposeFn?.();
				disposeFn = capture(runFn);
			});
		})(cycle);

		teardown(() => {
			disposed = true;
			disposeFn?.();
		});
	} else {
		fn(expr);
	}
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
		triggers.push([
			cycle => uncapture(() => fn(cycle)),
			cycle
		]);
		try {
			if (expr instanceof Signal) {
				return expr.value;
			} else {
				return (expr as () => T)();
			}
		} finally {
			triggers.pop();
		}
	} else {
		return expr;
	}
}

/**
 * Defer signal updates while calling a function and call the immediately after the function returns.
 *
 * @param fn The function to run.
 * @returns The function's return value.
 *
 * @example
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
	const batch: Dependant[] = [];
	BATCH_STACK.push(batch);
	let value: T;
	try {
		value = fn();
	} finally {
		BATCH_STACK.pop();
	}
	notify(batch);
	return value;
}

/**
 * Watch an expression and create a function to reactively access it's latest result.
 *
 * This is similar to {@link lazy}, but the expression is also evaluated if it isn't used and during batches.
 *
 * @param expr The expression to watch.
 * @param equals True to skip updates when a result is strictly equal to the previous one or a function to determine if the results are equal. Default is true.
 * @returns A function to access the latest result.
 *
 * @example
 * ```ts
 * import { sig, memo, watch } from "@mxjp/gluon";
 *
 * const count = sig(42);
 *
 * const memoized = memo(() => count.value);
 *
 * watch(memoized, count => {
 *   console.log("Count:", count);
 * });
 * ```
 */
export function memo<T>(expr: Expression<T>, equals?: SignalEqualsFn<T> | boolean): () => T {
	const signal = sig<T>(undefined!, equals);
	watch(expr, value => {
		signal.value = value;
	}, true);
	return () => signal.value;
}

/**
 * Wrap an expression to be evaulated only when any of the accessed signals have been updated.
 *
 * This is similar to {@link memo}, but the expression is only evaulated if it is used.
 *
 * @param expr The expression to wrap.
 * @returns A function to lazily evaluate the expression.
 */
export function lazy<T>(expr: Expression<T>): () => T {
	let value: T;
	let current = false;

	let proxyMap = new Map<DependantFn, number>();
	const proxy: Dependant = [(accessedCycle) => {
		if (proxy[1] === accessedCycle) {
			proxy[1]++;
			const map = proxyMap;
			proxyMap = new Map();
			map.forEach(callDependant);
		}
	}, 0];

	let cycle = 0;
	return () => {
		access(DEPENDANTS_STACK, proxyMap);
		if (!current) {
			current = true;
			DEPENDANTS_STACK.push([proxy]);
			try {
				value = trigger(expr, accessedCycle => {
					if (cycle === accessedCycle) {
						cycle++;
						current = false;
					}
				}, cycle);
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
	TRACKING_STACK.push(false);
	try {
		return fn();
	} finally {
		TRACKING_STACK.pop();
	}
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
	TRACKING_STACK.push(true);
	try {
		return fn();
	} finally {
		TRACKING_STACK.pop();
	}
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
	} else if (typeof expr === "function") {
		return (expr as () => T)();
	} else {
		return expr;
	}
}
