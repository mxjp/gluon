
export type TeardownHook = () => void;

const TEARDOWN_STACK: (TeardownHook[] | undefined)[] = [];

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

export function uncapture<T>(fn: () => T): T {
	TEARDOWN_STACK.push(undefined);
	try {
		return fn();
	} finally {
		TEARDOWN_STACK.pop();
	}
}

export function teardown(hook: TeardownHook): void {
	TEARDOWN_STACK[TEARDOWN_STACK.length - 1]?.push(hook);
}
