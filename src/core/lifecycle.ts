import { INTERNAL_GLOBALS } from "./internal-globals.js";
import { TeardownFrame, useStack } from "./internals.js";

const { TEARDOWN_STACK } = INTERNAL_GLOBALS;

/**
 * A function that can be called to dispose something.
 */
export type TeardownHook = () => void;

const NOOP = () => {};

/**
 * Run a function while capturing teardown hooks.
 *
 * @param fn The function to run.
 * @returns A function to run all captured teardown hooks.
 */
export function capture(fn: () => void): TeardownHook {
	const hooks: TeardownHook[] = [];
	useStack(TEARDOWN_STACK, hooks, fn);
	return hooks.length > 1
		? () => {
			for (let i = 0; i < hooks.length; i++) {
				hooks[i]();
			}
		}
		: hooks[0] ?? NOOP;
}

/**
 * Run a function while capturing teardown hooks that may dispose itself.
 *
 * @param fn The function to run.
 * @returns The function's return value.
 */
export function captureSelf<T>(fn: (dispose: TeardownHook) => T): T {
	let disposed = false;
	let dispose: TeardownHook | undefined = undefined;
	let value: T;
	dispose = capture(() => {
		value = fn(() => {
			disposed = true;
			dispose?.();
		});
	});
	if (disposed) {
		dispose();
	}
	return value!;
}

/**
 * Run a function without capturing any teardown hooks.
 *
 * This is the opposite of {@link capture}.
 *
 * @param fn The function to run.
 * @returns The function's return value.
 */
export function uncapture<T>(fn: () => T): T {
	return useStack(TEARDOWN_STACK, undefined, fn);
}

const NOCAPTURE: TeardownFrame = {
	push() {
		// Teardown hooks are explicitly not supported in this context:
		throw new Error("G0");
	},
};

/**
 * Run a function and explicitly un-support teardown hooks.
 *
 * Teardown hooks are still supported when using {@link capture}, {@link captureSelf} or {@link uncapture} inside of the function.
 *
 * This should be used in places where lifecycle side are never expected.
 *
 * @param fn The function to run.
 * @returns The function's return value.
 */
export function nocapture<T>(fn: () => T): T {
	TEARDOWN_STACK.push(NOCAPTURE);
	try {
		return fn();
	} finally {
		TEARDOWN_STACK.pop();
	}
}

/**
 * Register a teardown hook.
 *
 * This has no effect if teardown hooks are not captured in the current context.
 *
 * @param hook The hook to register. This may be called multiple times.
 * @throws An error if teardown hooks are {@link nocapture explicitly un-supported}.
 */
export function teardown(hook: TeardownHook): void {
	TEARDOWN_STACK[TEARDOWN_STACK.length - 1]?.push(hook);
}
