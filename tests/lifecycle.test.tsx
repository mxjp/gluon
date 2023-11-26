import test from "node:test";

import { TeardownHook, capture, teardown, uncapture } from "@mxjp/gluon";

import { assertEvents } from "./common.js";

await test("lifecycle", async ctx => {

	await ctx.test("inert use", () => {
		teardown(() => {
			throw new Error("this should not happen");
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

});
