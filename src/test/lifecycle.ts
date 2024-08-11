import { INTERNAL_GLOBALS } from "../core/internals.js";
import { TeardownHook } from "../core/lifecycle.js";

const { TEARDOWN_STACK } = INTERNAL_GLOBALS;

export type TeardownLeakHook = (hooK: TeardownHook) => void;

/**
 * Register a hook to be called when any teardown hooks are registered outside of any capture calls.
 *
 * Errors thrown from the leak hook will be thrown by the **teardown** calls.
 */
export function onTeardownLeak(hook: TeardownLeakHook): void {
	if (TEARDOWN_STACK.length > 0) {
		//
		throw new Error("G4");
	}
	TEARDOWN_STACK.push({ push: hook });
}
