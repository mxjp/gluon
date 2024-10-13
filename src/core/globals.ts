
/**
 * Get or create a shared global value.
 *
 * When using this, the caller must guarantee, that all future versions are compatible with the earliest version this has been used in.
 *
 * @param symbolKey A unique key that is used with `Symbol.for` to store the value on the `globalThis` object.
 * @param createNew A function to create a new value if there is none.
 * @returns The value.
 *
 * @example
 * ```tsx
 * const example = sharedGlobal("example-key", () => new Example());
 * ```
 */
export function sharedGlobal<T>(symbolKey: string, createNew: () => T): T {
	const key = Symbol.for(symbolKey);
	return (globalThis as any)[key] ?? ((globalThis as any)[key] = createNew());
}
