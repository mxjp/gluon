import type { ReadonlyContext } from "./context.js";
import type { TeardownHook } from "./lifecycle.js";

export interface Globals {
	/**
	 * The next suffix for generating unique ids in the current thread.
	 */
	nextId: { value: number };

	/**
	 * Internal stack where the last item is the current context.
	 */
	contextStack: (ReadonlyContext | undefined)[];

	/**
	 * Internal stack where the last item may be an array which teardown hooks are captured in.
	 */
	teardownStack: (TeardownHook[] | undefined)[];
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
