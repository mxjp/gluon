import { INTERNAL_GLOBALS } from "./internals.js";

const { NEXT_ID } = INTERNAL_GLOBALS;

/**
 * Allocate an ID that is unique in the current thread.
 *
 * @returns The unique id.
 */
export function uniqueId(): string {
	return "gluon_" + String(NEXT_ID.value++);
}

/**
 * Run a function with an ID that is unique in the current thread.
 *
 * @param fn The function to run.
 * @returns The function's return value.
 */
export function useUniqueId<T>(fn: (id: string) => T): T {
	return fn(uniqueId());
}
