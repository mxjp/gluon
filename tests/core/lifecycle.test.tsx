import "../env.js";

import { strictEqual } from "node:assert";
import test from "node:test";

import { capture, captureSelf, teardown, TeardownHook, uncapture } from "@mxjp/gluon";

import { assertEvents } from "../common.js";

await test("lifecycle", async ctx => {
	await ctx.test("inert use", () => {
		uncapture(() => {
			teardown(() => {
				throw new Error("this should not happen");
			});
		});
	});

	await ctx.test("capture", () => {
		const events: unknown[] = [];
		events.push(0);
		let inner!: TeardownHook;
		const outer = capture(() => {
			events.push(1);

			teardown(() => {
				events.push(2);
			});

			uncapture(() => {
				events.push(3);

				teardown(() => {
					events.push(4);
				});
			});

			inner = capture(() => {
				events.push(5);

				teardown(() => {
					events.push(6);
				});
			});
		});

		assertEvents(events, [0, 1, 3, 5]);
		outer();
		assertEvents(events, [2]);
		inner();
		assertEvents(events, [6]);
	});

	await ctx.test("capture self", async ctx => {
		await ctx.test("defer immediate", () => {
			const events: unknown[] = [];
			events.push(0);
			const value = captureSelf(dispose => {
				events.push(1);
				dispose();
				events.push(2);
				teardown(() => {
					events.push(3);
				});
				events.push(4);
				return 42;
			});
			strictEqual(value, 42);
			events.push(5);
			assertEvents(events, [0, 1, 2, 4, 3, 5]);
		});

		await ctx.test("delayed", () => {
			const events: unknown[] = [];
			events.push(0);
			const dispose = captureSelf(dispose => {
				events.push(1);
				teardown(() => {
					events.push(2);
				});
				events.push(3);
				return dispose;
			});
			events.push(4);
			dispose();
			events.push(5);
			assertEvents(events, [0, 1, 3, 4, 2, 5]);
		});
	});
});
