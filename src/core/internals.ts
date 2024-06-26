import type { ReadonlyContext } from "./context.js";
import { sharedGlobal } from "./globals.js";
import type { TeardownFrame } from "./lifecycle-types.js";
import type { Dependant } from "./signal-types.js";

export interface InternalGlobals {
	/**
	 * The next suffix for generating unique ids in the current thread.
	 */
	NEXT_ID: { value: number | bigint };

	/**
	 * A stack where the last item is the current context.
	 */
	CONTEXT_STACK: (ReadonlyContext | undefined)[];

	/**
	 * A stack where the last item may be an array which teardown hooks are captured in.
	 */
	TEARDOWN_STACK: (TeardownFrame | undefined)[];

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

export const INTERNAL_GLOBALS = sharedGlobal("gluon:globals", () => ({} as InternalGlobals));

INTERNAL_GLOBALS.NEXT_ID ??= { value: 0 };
INTERNAL_GLOBALS.CONTEXT_STACK ??= [];
INTERNAL_GLOBALS.TEARDOWN_STACK ??= [];
INTERNAL_GLOBALS.BATCH_STACK ??= [];
INTERNAL_GLOBALS.TRACKING_STACK ??= [true];
INTERNAL_GLOBALS.TRIGGERS_STACK ??= [[]];
INTERNAL_GLOBALS.DEPENDANTS_STACK ??= [[]];
