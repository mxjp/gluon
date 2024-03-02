import { GLOBALS } from "./globals.js";

/**
 * Allocate an ID that is unique in the current thread.
 *
 * @returns The unique id.
 */
export function uniqueId(): string {
	return "gluon_" + String(GLOBALS.nextId++);
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
