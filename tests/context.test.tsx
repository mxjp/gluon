import test from "node:test";

import { deriveContext, extract, inject } from "@mxjp/gluon";
import { strictEqual } from "node:assert";

await test("context", async ctx => {

	await ctx.test("nesting", () => {
		strictEqual(extract("foo"), undefined);

		inject(["foo", "bar"], () => {
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

});
