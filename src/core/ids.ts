
interface Shared {
	next: number;
}

const KEY = Symbol.for("gluon:next_id_container");
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const SHARED: Shared = (globalThis as any)[KEY] ?? ((globalThis as any)[KEY] = { next: 0 });
const PREFIX = "gluon_";

/**
 * Allocate an ID that is unique in the current thread.
 *
 * @returns The unique id.
 */
export function uniqueId(): string {
	return PREFIX + String(SHARED.next++);
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
