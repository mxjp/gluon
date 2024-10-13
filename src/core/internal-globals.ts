import { sharedGlobal } from "./globals.js";
import type { Dependant } from "./internals.js";

interface Globals {
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

const GLOBALS = sharedGlobal("gluon:globals", () => ({} as Globals));

const BATCH_STACK_KEY = "BATCH_STACK" as const;
export const BATCH_STACK = GLOBALS[BATCH_STACK_KEY] ??= [];

const TRACKING_STACK_KEY = "TRACKING_STACK" as const;
export const TRACKING_STACK = GLOBALS[TRACKING_STACK_KEY] ??= [true];

const TRIGGERS_STACK_KEY = "TRIGGERS_STACK" as const;
export const TRIGGERS_STACK = GLOBALS[TRIGGERS_STACK_KEY] ??= [[]];

const DEPENDANTS_STACK_KEY = "DEPENDANTS_STACK" as const;
export const DEPENDANTS_STACK = GLOBALS[DEPENDANTS_STACK_KEY] ??= [[]];
