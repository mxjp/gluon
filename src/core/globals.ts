
export interface Globals {
	/**
	 * The next suffix for generating unique ids in the current thread.
	 */
	nextId: { value: number };
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
