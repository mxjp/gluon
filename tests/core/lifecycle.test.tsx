import "../env.js";

import { strictEqual, throws } from "node:assert";
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

	await ctx.test("error handling", async ctx => {
		await ctx.test("capture", () => {
			const events: unknown[] = [];
			const outer = capture(() => {
				teardown(() => {
					events.push(0);
				});
				throws(() => {
					capture(() => {
						teardown(() => {
							throw new Error("this should never be called");
						});
						throw new Error("test");
					});
				}, error => {
					return (error instanceof Error) && error.message === "test";
				});
				teardown(() => {
					events.push(1);
				});
			});
			outer();
			assertEvents(events, [0, 1]);
		});

		for (const disposeInner of [false, true]) {
			await ctx.test(`captureSelf (immediate${disposeInner ? ", dispose inner" : ""})`, () => {
				const events: unknown[] = [];
				captureSelf(outer => {
					outer();
					teardown(() => {
						events.push(0);
					});
					throws(() => {
						captureSelf(inner => {
							if (disposeInner) {
								inner();
							}
							teardown(() => {
								throw new Error("this should never be called");
							});
							throw new Error("test");
						});
					}, error => {
						return (error instanceof Error) && error.message === "test";
					});
					teardown(() => {
						events.push(1);
					});
					assertEvents(events, []);
				});
				assertEvents(events, [0, 1]);
			});

			await ctx.test(`captureSelf (delayed${disposeInner ? ", dispose inner" : ""})`, () => {
				const events: unknown[] = [];
				let outerDispose!: TeardownHook;
				captureSelf(outer => {
					outerDispose = outer;
					teardown(() => {
						events.push(0);
					});
					let innerDispose!: TeardownHook;
					throws(() => {
						captureSelf(inner => {
							innerDispose = inner;
							teardown(() => {
								throw new Error("this should never be called");
							});
							throw new Error("test");
						});
					}, error => {
						return (error instanceof Error) && error.message === "test";
					});
					if (disposeInner) {
						innerDispose();
					}
					teardown(() => {
						events.push(1);
					});
				});
				assertEvents(events, []);
				outerDispose();
				assertEvents(events, [0, 1]);
			});
		}
	});
});
