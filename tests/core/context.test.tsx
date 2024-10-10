import { strictEqual, throws } from "node:assert";
import test from "node:test";

import { ContextKey, deriveContext, extract, inject } from "@mxjp/gluon";

import { withMsg } from "../common.js";

await test("context", async ctx => {
	await ctx.test("nesting", () => {
		strictEqual(extract("foo"), undefined);

		inject("foo", "bar", () => {
			strictEqual(extract("foo"), "bar");

			deriveContext(context => {
				strictEqual(extract("foo"), "bar");
				strictEqual(context.get("foo"), "bar");
				context.set("foo", "baz");
				strictEqual(extract("foo"), "baz");
			});

			strictEqual(extract("foo"), "bar");
		});

		strictEqual(extract("foo"), undefined);
	});

	await ctx.test("typed keys", () => {
		const KEY_A = Symbol("a") as ContextKey<number>;
		const KEY_B = Symbol("b") as ContextKey<string>;
		deriveContext(context => {
			context.set(KEY_A, 42);
			context.set(KEY_B, "test");

			const a: number | undefined = extract(KEY_A);
			strictEqual(a, 42);

			const b: string | undefined = extract(KEY_B);
			strictEqual(b, "test");
		});
	});

	await ctx.test("error handling", async ctx => {
		await ctx.test("inject", () => {
			strictEqual(extract("foo"), undefined);
			inject("foo", "bar", () => {
				strictEqual(extract("foo"), "bar");
				throws(() => {
					inject("foo", "baz", () => {
						strictEqual(extract("foo"), "baz");
						throw new Error("test");
					});
				}, withMsg("test"));
				strictEqual(extract("foo"), "bar");
			});
			strictEqual(extract("foo"), undefined);
		});

		await ctx.test("deriveContext", () => {
			strictEqual(extract("foo"), undefined);
			deriveContext(outer => {
				outer.set("foo", "bar");
				strictEqual(extract("foo"), "bar");
				throws(() => {
					deriveContext(inner => {
						inner.set("foo", "baz");
						outer.set("bar", "boo");
						strictEqual(extract("foo"), "baz");
						throw new Error("test");
					});
				}, withMsg("test"));
				strictEqual(extract("foo"), "bar");
				strictEqual(extract("bar"), "boo");
			});
			strictEqual(extract("foo"), undefined);
		});
	});
});
