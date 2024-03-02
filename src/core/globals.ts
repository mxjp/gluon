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
