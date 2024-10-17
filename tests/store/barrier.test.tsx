import { notStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import { unwrap, wrap } from "rvx/store";

await test("store/barrier", async ctx => {
	await ctx.test("non-reactive types", () => {
		// eslint-disable-next-line @typescript-eslint/no-extraneous-class
		class Test {}

		for (const value of [
			null,
			undefined,
			42,
			42n,
			true,
			false,
			new Test(),
		]) {
			strictEqual(value, wrap(value));
			strictEqual(value, unwrap(value));
		}
		strictEqual(Number.isNaN(wrap(NaN)), true);
	});

	await ctx.test("mapping", () => {
		const inner = {};
		const proxy = wrap(inner);
		notStrictEqual(inner, proxy);
		strictEqual(wrap(inner), proxy);
		strictEqual(wrap(proxy), proxy);
		strictEqual(unwrap(inner), inner);
		strictEqual(unwrap(proxy), inner);
	});
});
