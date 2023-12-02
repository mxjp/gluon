
const NEXT = Symbol.for("gluon:next_id");

/**
 * Allocate an ID that is unique in the current execution context.
 *
 * @returns The unique id.
 */
export function uniqueId(): number {
	const id = (globalThis as any)[NEXT] ?? 0;
	(globalThis as any)[NEXT] = id + 1;
	return id;
}

/**
 * Run a function with an ID that is unique in the current execution context.
 *
 * @param fn The function to run.
 * @returns The function's return value.
 */
export function useUniqueId<T>(fn: (id: number) => T): T {
	return fn(uniqueId());
}
