import { rejects, strictEqual } from "node:assert";
import test from "node:test";

import { sig } from "@mxjp/gluon";
import { watchFor } from "@mxjp/gluon/async";

await test("async/wait-for", async ctx => {
	await ctx.test("static", async () => {
		strictEqual(await watchFor(42), 42);
	});

	await ctx.test("default condition", async () => {
		const signal = sig(0);
		const promise = watchFor(signal);
		signal.value = 7;
		strictEqual(await promise, 7);
	});

	await ctx.test("custom condition", async () => {
		const signal = sig(7);
		const promise = watchFor(signal, v => v === 42);
		signal.value = 42;
		strictEqual(await promise, 42);
	});

	await ctx.test("guard condition", async () => {
		function isNumber(value: unknown): value is number {
			return typeof value === "number";
		}
		const signal = sig<unknown>("test");
		const promise: Promise<number> = watchFor(signal, isNumber);
		signal.value = 42;
		strictEqual(await promise, 42);
	});

	await ctx.test("timeout", async () => {
		await rejects(async () => {
			await watchFor(7, v => v === 42, 0);
		});
	});
});
