import { GLOBALS } from "./globals.js";

const { TEARDOWN_STACK } = GLOBALS;

/**
 * A function that can be called to dispose something.
 */
export type TeardownHook = () => void;

/**
 * Run a function while capturing teardown hooks.
 *
 * @param fn The function to run.
 * @returns A function to run all captured teardown hooks.
 */
export function capture(fn: () => void): TeardownHook {
	const hooks: TeardownHook[] = [];
	TEARDOWN_STACK.push(hooks);
	try {
		fn();
	} finally {
		TEARDOWN_STACK.pop();
	}
	if (hooks.length === 0) {
		return () => {};
	}
	if (hooks.length === 1) {
		return hooks[0];
	}
	return () => {
		for (let i = 0; i < hooks.length; i++) {
			hooks[i]();
		}
	};
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
	TEARDOWN_STACK.push(undefined);
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
 */
export function teardown(hook: TeardownHook): void {
	TEARDOWN_STACK[TEARDOWN_STACK.length - 1]?.push(hook);
}
