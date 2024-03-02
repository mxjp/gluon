import type { ReadonlyContext } from "./context.js";
import type { TeardownHook } from "./lifecycle.js";
import { Dependant } from "./signal-types.js";

export interface Globals {
	/**
	 * The next suffix for generating unique ids in the current thread.
	 */
	nextId: { value: number };

	/**
	 * A stack where the last item is the current context.
	 */
	contextStack: (ReadonlyContext | undefined)[];

	/**
	 * A stack where the last item may be an array which teardown hooks are captured in.
	 */
	teardownStack: (TeardownHook[] | undefined)[];

	/**
	 * A stack where the last item is the current signal batch. This may be empty.
	 */
	batchStack: Dependant[][];

	/**
	 * A stack where the last item indicates if signal access is currently tracked. This contains at least `true` by default.
	 */
	trackingStack: boolean[];

	/**
	 * A stack where the last item is an array of triggers to capture in any accessed signals. This is never empty.
	 */
	triggersStack: Dependant[][];

	/**
	 * A stack where the last item is an array of dependants to capture in any accessed signals. This is never empty.
	 */
	dependantsStack: Dependant[][];
}

const KEY = Symbol.for("gluon:globals");

/**
 * An object with globals in the current thread that can be shared by different gluon versions.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const GLOBALS: Globals = (globalThis as any)[KEY] ?? ((globalThis as any)[KEY] = {});

if (GLOBALS.nextId === undefined) {
	GLOBALS.nextId = { value: 0 };
}

if (GLOBALS.contextStack === undefined) {
	GLOBALS.contextStack = [];
}

if (GLOBALS.teardownStack === undefined) {
	GLOBALS.teardownStack = [];
}

if (GLOBALS.batchStack === undefined) {
	GLOBALS.batchStack = [];
}

if (GLOBALS.trackingStack === undefined) {
	GLOBALS.trackingStack = [true];
}

if (GLOBALS.triggersStack === undefined) {
	GLOBALS.triggersStack = [[]];
}

if (GLOBALS.dependantsStack === undefined) {
	GLOBALS.dependantsStack = [[]];
}
