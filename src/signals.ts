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
 * A container for defering updates.
 */
interface Batch {
	triggers: Dependant[],
	dependants: Dependant[],
}

/**
 * Internal stack where the last item indicates if the current update should be skipped. This may be empty.
 */
const SKIP_STACK: boolean[] = [];

/**
 * Internal stack where the last item is the current batch. This may be empty.
 */
const BATCH_STACK: Batch[] = [];

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
	 * @param equals True to skip updates when an assigned value is strictly equal to the previous one or a function to determine of the values are equal.
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
		const dependants = this.#dependants;
		if (BATCH_STACK.length > 0) {
			const batch = BATCH_STACK[BATCH_STACK.length - 1];
			batch.triggers.push(...triggers);
			batch.dependants.push(...dependants);
			triggers.clear();
			dependants.clear();
		} else {
			this.#triggers = new Map();
			this.#dependants = new Map();
			triggers.forEach(callDependant);
			dependants.forEach(callDependant);
		}
	}
}

/**
 * Create a new signal.
 *
 * @param value The initial value.
 * @param equals True to skip updates when an assigned value is strictly equal to the previous one or a function to determine of the values are equal.
 * @returns The signal.
 */
export function sig<T>(value: T, equals?: SignalEqualsFn<T> | boolean): Signal<T> {
	return new Signal(value, equals);
}

/**
 * A value, signal or function to get a value.
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
 */
export function watch<T>(expr: Expression<T>, fn: (value: T) => void): void {
	if (expr instanceof Signal || typeof expr === "function") {
		const context = getContext();
		let disposed = false;
		let update = false;
		let disposeFn: TeardownHook | undefined;
		let cycle = 0;

		let value: T;
		const runExpr = expr instanceof Signal
			? () => { value = expr.value }
			: () => { value = (expr as () => T)() };

		const runFn = () => fn(value);

		(function dependant(accessedCycle: number): void {
			if (disposed || cycle !== accessedCycle) {
				return;
			}
			cycle++;
			runInContext(context, () => {
				const dependants = DEPENDANTS_STACK[DEPENDANTS_STACK.length - 1];
				dependants.push([dependant, cycle]);
				if (update) {
					SKIP_STACK.push(false);
				}
				try {
					uncapture(runExpr);
				} finally {
					dependants.pop();
					if (update && SKIP_STACK.pop()) {
						return;
					}
				}
				disposeFn?.();
				disposeFn = capture(runFn);
				update = true;
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
 * Evaluate an expression and call a function when any accessed signals are updated.
 *
 * @param expr The expression evaluate.
 * @param fn The function to call when any accessed signals are updated.
 * @param cycle An arbitrary number to pass back to the function.
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
 */
export function batch<T>(fn: () => T): T {
	const triggers: Dependant[] = [];
	const dependants: Dependant[] = [];
	BATCH_STACK.push({ triggers, dependants });
	let value: T;
	try {
		value = fn();
	} finally {
		BATCH_STACK.pop();
	}
	notify(triggers);
	notify(dependants);
	return value;
}

/**
 * Skip the current update.
 *
 * This is the opposite of {@link unskip}.
 */
export function skip(): void {
	if (SKIP_STACK.length > 0) {
		SKIP_STACK[SKIP_STACK.length - 1] = true;
	}
}

/**
 * The opposite of {@link skip}.
 */
export function unskip(): void {
	if (SKIP_STACK.length > 0) {
		SKIP_STACK[SKIP_STACK.length - 1] = false;
	}
}

/**
 * Wrap an expression to skip updates if it's result is strictly equal to the previous one.
 *
 * @param expr The expression to wrap.
 * @returns A function to evaluate the expression.
 */
export function skipEqual<T>(expr: Expression<T>): () => T {
	let previous: T | undefined = undefined;
	return () => {
		const value = get(expr);
		if (previous === value) {
			skip();
		} else {
			previous = value;
		}
		return value;
	};
}

type BranchResults<T extends readonly (() => unknown)[]> = {
	-readonly [P in keyof T]: ExpressionResult<T[P]>;
};

/**
 * Skip the current update only if all branches skip.
 *
 * @param branches The branches to run.
 * @returns An array where each value corresponds to the result of the branch at the same index.
 */
export function branch<T extends readonly (() => unknown)[]>(...branches: T): BranchResults<T> {
	const results = [] as BranchResults<T>;
	let skips = 0;
	for (let i = 0; i < branches.length; i++) {
		SKIP_STACK.push(false);
		try {
			results.push(get(branches[i]));
		} finally {
			if (SKIP_STACK.pop()) {
				skips++;
			}
		}
	}
	if (skips === branches.length) {
		skip();
	}
	return results;
}

/**
 * Internal utility for creating an intermediate proxy to capture dependants and call later.
 *
 * @param stack The stack to use.
 * @returns A tuple with a function to capture current dependants and the dependant that acts as the proxy.
 */
function createStackProxy(stack: Dependant[][]): [access: () => void, proxy: Dependant] {
	let proxyMap = new Map<DependantFn, number>();
	const proxy: Dependant = [(accessedCycle) => {
		if (proxy[1] !== accessedCycle) {
			return;
		}
		proxy[1]++;
		const map = proxyMap;
		proxyMap = new Map();
		map.forEach(callDependant);
	}, 0];
	return [
		() => access(stack, proxyMap),
		proxy,
	];
}

/**
 * Wrap an expression to be evaulated only initially or when any accessed signal has been updated since the last call.
 *
 * @param expr The expression to wrap.
 * @returns A function to lazily evaluate the expression.
 */
export function lazy<T>(expr: Expression<T>): () => T {
	let value: T;
	let current = false;
	const [accessTriggers, triggerProxy] = createStackProxy(TRIGGERS_STACK);
	const [accessDependants, dependantProxy] = createStackProxy(DEPENDANTS_STACK);
	let cycle = 0;
	return () => {
		accessTriggers();
		accessDependants();
		if (!current) {
			current = true;
			TRIGGERS_STACK.push([triggerProxy]);
			DEPENDANTS_STACK.push([dependantProxy]);
			try {
				value = trigger(expr, accessedCycle => {
					if (cycle === accessedCycle) {
						cycle++;
						current = false;
					}
				}, cycle);
			} finally {
				TRIGGERS_STACK.pop();
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
