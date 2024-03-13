import "./env.js";

import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import { batch, capture, extract, get, inject, lazy, map, memo, optionalString, sig, Signal, string, teardown, trigger, uncapture, watch, watchUpdates } from "@mxjp/gluon";

import { assertEvents, assertSharedInstance } from "./common.js";

await test("signals", async ctx => {
	await ctx.test("shared instances", () => {
		assertSharedInstance(Signal, "gluon:signal_instance", sig(42));
	});

	await ctx.test("inert usage", () => {
		const signal = sig(42);
		strictEqual(signal.value, 42);

		signal.value = 7;
		strictEqual(signal.value, 7);

		const signal2 = sig([1]);
		deepStrictEqual(signal2.value, [1]);

		signal2.update(value => {
			value.push(2);
		});
		deepStrictEqual(signal2.value, [1, 2]);

		signal.access();
		signal.notify();
	});

	await ctx.test("pipe", () => {
		const a = sig(42);
		const c = a.pipe(b => {
			strictEqual(a, b);
			return 7;
		});
		strictEqual(c, 7);
	});

	await ctx.test("watch", async ctx => {
		await ctx.test("static", () => {
			const events: unknown[] = [];
			watch(42, value => {
				events.push(value);
			});
			assertEvents(events, [42]);
		});

		await ctx.test("signal & dispose", () => {
			const events: unknown[] = [];
			const signal = sig(42);
			const dispose = capture(() => {
				watch(signal, value => {
					events.push(value);
				});
			});
			assertEvents(events, [42]);

			signal.value = 7;
			assertEvents(events, [7]);

			signal.value = 8;
			assertEvents(events, [8]);

			dispose();
			signal.value = 9;
			assertEvents(events, []);
		});

		await ctx.test("function & batch", () => {
			const events: unknown[] = [];
			const a = sig("a");
			const b = sig(1);
			uncapture(() => watch(() => a.value + b.value, value => {
				events.push(value);
			}));
			assertEvents(events, ["a1"]);

			a.value = "b";
			assertEvents(events, ["b1"]);

			b.value = 2;
			assertEvents(events, ["b2"]);

			batch(() => {
				a.value = "c";
				b.value = 3;
				assertEvents(events, []);
			});
			assertEvents(events, ["c3"]);
		});

		await ctx.test("uncapture expression", () => {
			const events: unknown[] = [];
			const signal = sig(42);
			uncapture(() => watch(() => {
				teardown(() => {
					throw new Error("invalid teardown");
				});
				return signal.value;
			}, value => {
				events.push(value);
			}));
			assertEvents(events, [42]);

			const dispose = capture(() => {
				signal.value = 7;
				assertEvents(events, [7]);
			});
			assertEvents(events, []);
			dispose();
			assertEvents(events, []);
		});

		await ctx.test("capture callback", () => {
			const events: unknown[] = [];
			const signal = sig(1);

			const dispose = capture(() => {
				watch(signal, value => {
					teardown(() => {
						events.push(`-${value}`);
					});
					events.push(`+${value}`);
				});
			});

			assertEvents(events, ["+1"]);

			signal.value = 2;
			assertEvents(events, ["-1", "+2"]);

			dispose();
			assertEvents(events, ["-2"]);

			signal.value = 3;
			assertEvents(events, []);
		});

		await ctx.test("access cycles", () => {
			const a = sig(false);
			const b = sig(7);
			const events: unknown[] = [];

			uncapture(() => watch(() => a.value ? b.value : 0, value => {
				events.push(value);
			}));

			assertEvents(events, [0]);

			b.value = 3;
			assertEvents(events, []);

			a.value = true;
			assertEvents(events, [3]);

			b.value = 42;
			assertEvents(events, [42]);

			a.value = false;
			assertEvents(events, [0]);

			b.value = 2;
			assertEvents(events, []);

			a.value = true;
			assertEvents(events, [2]);
		});

		await ctx.test("stack isolation", () => {
			const events: unknown[] = [];
			const inner = sig(1);
			const outer = sig(1);

			uncapture(() => watch(() => {
				watch(inner, value => {
					events.push(`i${value}`);
				});
				return outer.value;
			}, value => {
				events.push(`o${value}`);
			}));

			assertEvents(events, ["i1", "o1"]);
			inner.value = 2;
			assertEvents(events, ["i2"]);
			outer.value = 2;
			assertEvents(events, ["i2", "o2"]);
		});

		await ctx.test("context", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			inject("test", 42, () => {
				uncapture(() => watch(() => {
					events.push(`e${extract("test")}`);
					signal.access();
				}, () => {
					events.push(`c${extract("test")}`);
				}));
			});
			assertEvents(events, ["e42", "c42"]);
			inject("test", 7, () => {
				signal.notify();
			});
			assertEvents(events, ["e42", "c42"]);
		});
	});

	await ctx.test("watchUpdates", async () => {
		const events: unknown[] = [];
		const signal = sig("a");
		const dispose = capture(() => {
			const first = watchUpdates(signal, value => {
				events.push(value);
			});
			strictEqual(first, "a");
		});
		assertEvents(events, []);
		signal.value = "b";
		assertEvents(events, ["b"]);
		signal.value = "c";
		assertEvents(events, ["c"]);
		dispose();
		signal.value = "d";
		assertEvents(events, []);
	});

	await ctx.test("trigger", async ctx => {
		await ctx.test("behavior", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			const value = trigger(() => {
				events.push(`?${signal.value}`);
				return signal.value;
			}, () => {
				events.push("trigger");
			});
			strictEqual(value, 1);

			assertEvents(events, ["?1"]);

			signal.value = 7;
			assertEvents(events, ["trigger"]);

			signal.value = 2;
			assertEvents(events, []);
		});

		await ctx.test("nested triggers", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			const value = trigger(() => {
				return trigger(() => {
					events.push(`?${signal.value}`);
					return signal.value;
				}, () => {
					events.push("inner");
				});
			}, () => {
				events.push("outer");
			});
			strictEqual(value, 1);

			assertEvents(events, ["?1"]);

			signal.value = 7;
			assertEvents(events, ["outer", "inner"]);

			signal.value = 2;
			assertEvents(events, []);
		});

		await ctx.test("trigger priority", () => {
			const events: unknown[] = [];
			const signal = sig(1);

			trigger(signal, () => {
				events.push("a");
			});

			uncapture(() => watch(signal, value => {
				events.push(value);
			}));

			trigger(signal, () => {
				events.push("b");
			});

			assertEvents(events, [1]);

			signal.value = 2;
			assertEvents(events, ["a", "b", 2]);
		});

		await ctx.test("evaluate and update during batch", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			batch(() => {
				trigger(signal, () => {
					events.push("a");
				});
				assertEvents(events, []);
				signal.value = 2;
				assertEvents(events, ["a"]);
			});
			assertEvents(events, []);
		});

		await ctx.test("update during batch", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			trigger(signal, () => {
				events.push("a");
			});
			assertEvents(events, []);
			batch(() => {
				signal.value = 2;
				assertEvents(events, ["a"]);
			});
			assertEvents(events, []);
		});
	});

	await ctx.test("memo", async ctx => {
		await ctx.test("watch", () => {
			const events: unknown[] = [];
			const signal = sig(1);

			uncapture(() => watch(memo(() => {
				events.push("e");
				return signal.value;
			}), value => {
				events.push(value);
			}));

			assertEvents(events, ["e", 1]);
			signal.value = 2;
			assertEvents(events, ["e", 2]);
			signal.notify();
			assertEvents(events, ["e"]);
		});

		await ctx.test("batch & nested memos", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			const inner = uncapture(() => memo(() => {
				events.push("i");
				return signal.value * 2;
			}));
			const outer = uncapture(() => memo(() => {
				events.push("o");
				return signal.value + inner();
			}));

			uncapture(() => watch(outer, value => {
				events.push(value);
			}));

			assertEvents(events, ["i", "o", 3]);
			signal.value = 2;
			assertEvents(events, ["i", "o", 6]);

			batch(() => {
				signal.value = 3;
				assertEvents(events, ["i", "o"]);
			});
			assertEvents(events, [9]);
		});
	});

	await ctx.test("lazy", async ctx => {
		await ctx.test("behavior", () => {
			const events: unknown[] = [];
			const a = sig(2);
			const b = sig(3);

			const expr = lazy(() => {
				events.push("eval");
				return a.value * b.value;
			});
			assertEvents(events, []);

			const dispose = capture(() => {
				watch(expr, value => {
					events.push(`x${value}`);
				});
				assertEvents(events, ["eval", "x6"]);

				watch(expr, value => {
					events.push(`y${value}`);
				});
				assertEvents(events, ["y6"]);
			});

			a.value = 1;
			assertEvents(events, ["eval", "x3", "y3"]);

			dispose();
			assertEvents(events, []);

			b.value = 5;
			assertEvents(events, []);
		});

		await ctx.test("batch", () => {
			const events: unknown[] = [];
			const a = sig(2);
			const b = sig(3);

			const expr = lazy(() => {
				events.push("eval");
				return a.value * b.value;
			});
			assertEvents(events, []);

			uncapture(() => {
				watch(expr, value => {
					events.push(`x${value}`);
				});
				watch(expr, value => {
					events.push(`y${value}`);
				});
			});

			assertEvents(events, ["eval", "x6", "y6"]);

			batch(() => {
				a.value = 1;
				b.value = 4;
				assertEvents(events, []);
			});

			assertEvents(events, ["eval", "x4", "y4"]);
		});

		await ctx.test("trigger", () => {
			const events: unknown[] = [];
			const signal = sig(1);

			const expr = lazy(() => {
				events.push("eval");
				return signal.value;
			});
			assertEvents(events, []);

			const value = trigger(expr, () => {
				events.push("a");
			});
			strictEqual(value, 1);
			assertEvents(events, ["eval"]);

			signal.value = 2;
			assertEvents(events, ["a"]);
		});

		await ctx.test("access cycles", () => {
			const events: unknown[] = [];
			const a = sig(false);
			const b = sig(42);

			const expr = lazy(() => {
				events.push("eval");
				return a.value ? b.value : 0;
			});
			assertEvents(events, []);

			uncapture(() => {
				watch(expr, value => {
					events.push(`x${value}`);
				});
				watch(expr, value => {
					events.push(`y${value}`);
				});
			});

			assertEvents(events, ["eval", "x0", "y0"]);

			b.value = 7;
			assertEvents(events, []);

			a.value = true;
			assertEvents(events, ["eval", "x7", "y7"]);

			b.value = 8;
			assertEvents(events, ["eval", "x8", "y8"]);

			a.value = false;
			assertEvents(events, ["eval", "x0", "y0"]);

			b.value = 3;
			assertEvents(events, []);
		});

		await ctx.test("inert & mixed usage", () => {
			const events: unknown[] = [];
			const signal = sig(1);

			const expr = lazy(() => {
				events.push("eval");
				return signal.value;
			});
			assertEvents(events, []);

			strictEqual(expr(), 1);
			assertEvents(events, ["eval"]);

			uncapture(() => watch(expr, value => {
				events.push(value);
			}));
			assertEvents(events, [1]);

			signal.value = 2;
			assertEvents(events, ["eval", 2]);
		});

		await ctx.test("lazy in batch with memos", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			const inner = uncapture(() => memo(() => {
				events.push("inner");
				return signal.value;
			}));
			assertEvents(events, ["inner"]);
			const outer = lazy(() => {
				events.push("outer");
				return inner();
			});
			assertEvents(events, []);
			uncapture(() => watch(outer, value => {
				events.push(value);
			}));
			assertEvents(events, ["outer", 1]);
			batch(() => {
				signal.value = 2;
				assertEvents(events, ["inner"]);
				signal.value = 3;
				assertEvents(events, ["inner"]);
			});
			assertEvents(events, ["outer", 3]);
		});
	});

	await ctx.test("mapper", () => {
		strictEqual(map(42, String), "42");

		const a = map(() => 42, String);
		strictEqual(typeof a, "function");
		strictEqual((a as () => string)(), "42");

		const b = map(sig(42), String);
		strictEqual(typeof b, "function");
		strictEqual((b as () => string)(), "42");
	});

	await ctx.test("string", () => {
		strictEqual(get(string(42)), "42");
		strictEqual(get(string(null)), "null");
		strictEqual(get(string(undefined)), "undefined");
	});

	await ctx.test("optionalString", () => {
		strictEqual(get(optionalString(42)), "42");
		strictEqual(get(optionalString(null)), null);
		strictEqual(get(optionalString(undefined)), undefined);
	});
});
