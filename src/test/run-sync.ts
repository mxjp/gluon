import { Context, deriveContext } from "../core/context.js";
import { captureSelf } from "../core/lifecycle.js";

export type TestFn<T> = (ctx: Context) => T;

export function runTest<T>(fn: TestFn<T>): T {
	return captureSelf(dispose => {
		try {
			return deriveContext(fn);
		} finally {
			dispose();
		}
	});
}
