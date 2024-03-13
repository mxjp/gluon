
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

/**
 * Ensure that instances of the target class are also recognized as instances of the same target class from other library versions.
 *
 * When using this, the caller must guarantee, that all future versions of the target class are compatible with the earliest version this has been used on.
 *
 * @example
 * ```tsx
 * class Example {
 *   static {
 *     shareInstancesOf(this, "example-key");
 *   }
 * }
 * ```
 */
export function shareInstancesOf(targetClass: { prototype: object }, symbolKey: string): void {
	const marker = Symbol.for(symbolKey);
	(targetClass.prototype as any)[marker] = true;
	const native = (targetClass as any)[Symbol.hasInstance] as (target: any) => boolean;
	Object.defineProperty(targetClass, Symbol.hasInstance, {
		configurable: true,
		enumerable: false,
		writable: false,
		value: function hasInstance(target: any): boolean {
			return target?.[marker] ?? native.call(this, target);
		},
	});
}
