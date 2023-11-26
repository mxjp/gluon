import { getContext, runInContext } from "./context.js";
import { TeardownHook, capture, teardown, uncapture } from "./lifecycle.js";

type DependantFn = (cycle: number) => void;
type Dependant = [DependantFn, number];

interface Batch {
	triggers: Dependant[],
	dependants: Dependant[],
}

const SKIP_STACK: boolean[] = [];
const BATCH_STACK: Batch[] = [];
const TRACKING_STACK: boolean[] = [true];
const TRIGGERS_STACK: Dependant[][] = [[]];
const DEPENDANTS_STACK: Dependant[][] = [[]];

export type SignalEqualsFn<T> = (previous: T, current: T) => boolean;

function access(stack: Dependant[][], map: Map<DependantFn, number>) {
	const top = stack[stack.length - 1];
	for (let i = 0; i < top.length; i++) {
		const [fn, cycle] = top[i];
		map.set(fn, cycle);
	}
}

function notify(top: Dependant[]) {
	for (let i = 0; i < top.length; i++) {
		const [fn, cycle] = top[i];
		fn(cycle);
	}
}

function callDependant(cycle: number, fn: DependantFn) {
	fn(cycle);
}

export class Signal<T> {
	#value: T;
	#equals: SignalEqualsFn<T>;
	#triggers = new Map<DependantFn, number>();
	#dependants = new Map<DependantFn, number>();

	constructor(value: T, equals: SignalEqualsFn<T> | boolean = true) {
		this.#value = value;
		this.#equals = typeof equals === "function"
			? equals
			: (equals ? (a, b) => a === b : () => false);
	}

	get value(): T {
		this.access();
		return this.#value;
	}

	set value(value: T) {
		if (!this.#equals(this.#value, value)) {
			this.#value = value;
			this.notify();
		}
	}

	update(fn: (value: T) => void | boolean): void {
		if (fn(this.#value) !== false) {
			this.notify();
		}
	}

	access(): void {
		if (TRACKING_STACK[TRACKING_STACK.length - 1]) {
			access(TRIGGERS_STACK, this.#triggers);
			access(DEPENDANTS_STACK, this.#dependants);
		}
	}

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

export function sig<T>(value: T, equals?: SignalEqualsFn<T> | boolean): Signal<T> {
	return new Signal(value, equals);
}

export type Expression<T> = T | Signal<T> | (() => T);

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

export function skip(): void {
	if (SKIP_STACK.length > 0) {
		SKIP_STACK[SKIP_STACK.length - 1] = true;
	}
}

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

export function untrack<T>(fn: () => T): T {
	TRACKING_STACK.push(false);
	try {
		return fn();
	} finally {
		TRACKING_STACK.pop();
	}
}

export function track<T>(fn: () => T): T {
	TRACKING_STACK.push(true);
	try {
		return fn();
	} finally {
		TRACKING_STACK.pop();
	}
}

export function get<T>(expr: Expression<T>): T {
	if (expr instanceof Signal) {
		return expr.value;
	} else if (typeof expr === "function") {
		return (expr as () => T)();
	} else {
		return expr;
	}
}
