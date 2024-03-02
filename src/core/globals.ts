import type { ReadonlyContext } from "./context.js";
import type { TeardownHook } from "./lifecycle.js";
import { Dependant } from "./signal-types.js";

export interface Globals {
	/**
	 * The next suffix for generating unique ids in the current thread.
	 */
	NEXT_ID: { value: number };

	/**
	 * A stack where the last item is the current context.
	 */
	CONTEXT_STACK: (ReadonlyContext | undefined)[];

	/**
	 * A stack where the last item may be an array which teardown hooks are captured in.
	 */
	TEARDOWN_STACK: (TeardownHook[] | undefined)[];

	/**
	 * A stack where the last item is the current signal batch. This may be empty.
	 */
	BATCH_STACK: Dependant[][];

	/**
	 * A stack where the last item indicates if signal access is currently tracked. This contains at least `true` by default.
	 */
	TRACKING_STACK: boolean[];

	/**
	 * A stack where the last item is an array of triggers to capture in any accessed signals. This is never empty.
	 */
	TRIGGERS_STACK: Dependant[][];

	/**
	 * A stack where the last item is an array of dependants to capture in any accessed signals. This is never empty.
	 */
	DEPENDANTS_STACK: Dependant[][];
}

const KEY = Symbol.for("gluon:globals");

/**
 * An object with globals in the current thread that can be shared by different gluon versions.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const GLOBALS: Globals = (globalThis as any)[KEY] ?? ((globalThis as any)[KEY] = {});

GLOBALS.NEXT_ID ??= { value: 0 };
GLOBALS.CONTEXT_STACK ??= [];
GLOBALS.TEARDOWN_STACK ??= [];
GLOBALS.BATCH_STACK ??= [];
GLOBALS.TRACKING_STACK ??= [true];
GLOBALS.TRIGGERS_STACK ??= [[]];
GLOBALS.DEPENDANTS_STACK ??= [[]];

/**
 * Ensure that instances of the target class are also recognized as instances of the same target class from other library versions.
 *
 * When using this, the caller must guarantee, that all future versions of the target class are compatible with the earliest version this has been used on.
 */
export function shareInstancesOf(targetClass: { prototype: object }, symbolKey: string): void {
	const marker = Symbol.for(symbolKey);
	(targetClass.prototype as any)[marker] = true;
	const native = (targetClass as any)[Symbol.hasInstance] as (target: any) => boolean;
	Object.defineProperty(targetClass, Symbol.hasInstance, {
		configurable: true,
		enumerable: false,
		writable: false,
		value: function hasInstance(target: any): boolean {
			return target?.[marker] ?? native.call(this, target);
		},
	});
}
