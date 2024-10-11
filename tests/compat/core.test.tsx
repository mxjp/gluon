import { deepStrictEqual, notStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import * as vCurrent from "@mxjp/gluon";

import { NEXT_ID } from "../../dist/es/core/internal-globals.js";
import * as v5 from "../../test_data/compat/gluon-5.2.0.js";
import { assertEvents, text } from "../common.js";

await test("compat: core", async ctx => {
	for (const [name, a, b] of [
		["current+v5", vCurrent, v5],
		["v5+current", v5, vCurrent],
	] as [
		string,
		typeof v5 & typeof vCurrent,
		typeof v5 & typeof vCurrent,
	][]) {
		notStrictEqual(a, b);

		await ctx.test(name, async ctx => {
			await ctx.test("instances", () => {
				strictEqual(a.sig(42) instanceof b.Signal, true);
				strictEqual(a.render(<></>) instanceof b.View, true);
			});

			await ctx.test("watch, signal", () => {
				const events: unknown[] = [];
				const signal = a.sig(42);
				a.uncapture(() => b.watch(signal, value => {
					events.push(value);
				}));
				assertEvents(events, [42]);
				signal.value = 77;
				assertEvents(events, [77]);
			});

			await ctx.test("trigger, signal", () => {
				const events: unknown[] = [];
				const signal = a.sig(42);
				strictEqual(b.trigger(signal, cycle => {
					events.push(cycle);
				}, 7), 42);
				assertEvents(events, []);
				signal.value = 77;
				assertEvents(events, [7]);
			});

			await ctx.test("mixed triggers", () => {
				const events: unknown[] = [];
				const signalA = a.sig(1);
				const signalB = b.sig(2);
				strictEqual(b.trigger(() => signalA.value + signalB.value, cycle => {
					events.push(cycle, signalA.value, signalB.value);
				}, 77), 3);
				assertEvents(events, []);
				signalA.value = 3;
				assertEvents(events, [77, 3, 2]);
				signalB.value = 4;
				assertEvents(events, [77, 3, 4]);
			});

			await ctx.test("batch", () => {
				const events: unknown[] = [];
				const signalA = a.sig(1);
				const signalB = b.sig(2);
				b.uncapture(() => a.watch(() => signalA.value + signalB.value, value => {
					events.push(value);
				}));
				assertEvents(events, [3]);
				a.batch(() => {
					signalA.value = 3;
					signalB.value = 4;
					assertEvents(events, []);
				});
				assertEvents(events, [7]);
			});

			await ctx.test("tracking", () => {
				const events: unknown[] = [];
				const signalA = a.sig(1);
				const signalB = b.sig(2);
				b.uncapture(() => a.watch(() => b.track(() => signalA.value) + a.untrack(() => signalB.value), value => {
					events.push(value);
				}));
				assertEvents(events, [3]);
				signalB.value = 3;
				assertEvents(events, []);
				signalA.value = 4;
				assertEvents(events, [7]);
			});

			await ctx.test("ids", () => {
				const original = NEXT_ID.value;
				try {
					NEXT_ID.value = 2;
					strictEqual(a.uniqueId(), `gluon_2`);
					strictEqual(b.uniqueId(), `gluon_3`);
					strictEqual(a.uniqueId(), `gluon_4`);

					NEXT_ID.value = 7n;
					strictEqual(b.uniqueId(), `gluon_7`);
					strictEqual(a.uniqueId(), `gluon_8`);
					strictEqual(b.uniqueId(), `gluon_9`);
				} finally {
					NEXT_ID.value = original;
				}
			});

			await ctx.test("lifecycle", () => {
				const events: unknown[] = [];
				const dispose = a.capture(() => {
					b.teardown(() => {
						events.push(0);
					});
					a.teardown(() => {
						events.push(1);
					});
				});
				assertEvents(events, []);
				dispose();
				// Teardown order is reversed from v13 or later:
				assertEvents(events, a === vCurrent ? [1, 0] : [0, 1]);
			});

			await ctx.test("context", () => {
				deepStrictEqual(
					a.inject("a", 1, () => {
						return b.inject("b", 2, () => {
							return a.inject("c", 3, () => {
								return [
									b.extract("a"),
									b.extract("b"),
									b.extract("c"),
									b.extract("d"),
								];
							});
						});
					}),
					[1, 2, 3, undefined],
				);
			});

			await ctx.test("view", async () => {
				const events: unknown[] = [];

				function createView(lib: typeof vCurrent | typeof v5, source: vCurrent.Signal<number> | v5.Signal<number>) {
					function inner() {
						const value = source.value;
						return () => String(value);
					}
					return lib === vCurrent
						? <vCurrent.Nest>{inner}</vCurrent.Nest> as vCurrent.View
						: v5.nest(inner);
				}

				b.uncapture(() => {
					const signalA = a.sig(0);
					const signalB = b.sig(1);

					const viewA = createView(b, signalA);
					const viewB = createView(a, signalB);

					const wrapper = a.render([
						viewA,
						viewB,
					]);

					wrapper.setBoundaryOwner((first, last) => {
						events.push(first, last);
					});

					assertEvents(events, []);
					strictEqual(text(wrapper.take()), "01");

					signalA.value = 2;
					assertEvents(events, [viewA.first, viewB.last]);
					strictEqual(text(wrapper.take()), "21");

					signalB.value = 3;
					assertEvents(events, [viewA.first, viewB.last]);
					strictEqual(text(wrapper.take()), "23");
				});
			});
		});
	}
});
