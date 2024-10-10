import test from "node:test";

import { sig, uncapture, watch } from "@mxjp/gluon";

import { assertEvents } from "../common.js";

await test("compat: core", async ctx => {
	const v5 = await import("../../test_data/compat/gluon-5.2.0.js");

	await ctx.test("watch signal5", async () => {
		const events: unknown[] = [];
		const signal = v5.sig(42);
		uncapture(() => watch(signal, value => {
			events.push(value);
		}));
		assertEvents(events, [42]);
		signal.value = 77;
		assertEvents(events, [77]);
	});

	await ctx.test("watch5 signal", async () => {
		const events: unknown[] = [];
		const signal = sig(42);
		v5.uncapture(() => v5.watch(signal, value => {
			events.push(value);
		}));
		assertEvents(events, [42]);
		signal.value = 77;
		assertEvents(events, [77]);
	});
});
