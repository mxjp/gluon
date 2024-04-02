import "../env.js";

import { deepStrictEqual, strictEqual, throws } from "node:assert";
import test from "node:test";

import { batch, capture, effect, extract, get, inject, isTracking, lazy, map, memo, optionalString, sig, Signal, string, teardown, TeardownHook, track, trigger, uncapture, untrack, watch, watchUpdates } from "@mxjp/gluon";

import { assertEvents, assertSharedInstance } from "../common.js";

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
			strictEqual(isTracking(), false);
			watch(42, value => {
				events.push(value);
			});
			strictEqual(isTracking(), false);
			assertEvents(events, [42]);
		});

		await ctx.test("signal & dispose", () => {
			const events: unknown[] = [];
			const signal = sig(42);
			strictEqual(signal.active, false);
			const dispose = capture(() => {
				strictEqual(isTracking(), false);
				watch(signal, value => {
					events.push(value);
				});
				strictEqual(isTracking(), false);
				strictEqual(signal.active, true);
			});
			assertEvents(events, [42]);

			signal.value = 7;
			strictEqual(signal.active, true);
			assertEvents(events, [7]);

			signal.value = 8;
			strictEqual(signal.active, true);
			assertEvents(events, [8]);

			dispose();
			strictEqual(signal.active, true);
			signal.value = 9;
			strictEqual(signal.active, false);
			assertEvents(events, []);
		});

		await ctx.test("function & batch", () => {
			const events: unknown[] = [];
			const a = sig("a");
			const b = sig(1);
			strictEqual(a.active, false);
			strictEqual(b.active, false);
			strictEqual(isTracking(), false);
			uncapture(() => watch(() => {
				strictEqual(isTracking(), true);
				return a.value + b.value;
			}, value => {
				strictEqual(isTracking(), false);
				events.push(value);
			}));
			strictEqual(isTracking(), false);
			strictEqual(a.active, true);
			strictEqual(b.active, true);
			assertEvents(events, ["a1"]);

			a.value = "b";
			strictEqual(a.active, true);
			assertEvents(events, ["b1"]);

			b.value = 2;
			strictEqual(b.active, true);
			assertEvents(events, ["b2"]);

			batch(() => {
				strictEqual(isTracking(), false);
				strictEqual(a.active, true);
				strictEqual(b.active, true);
				a.value = "c";
				b.value = 3;
				strictEqual(a.active, false);
				strictEqual(b.active, false);
				assertEvents(events, []);
				strictEqual(isTracking(), false);
			});
			strictEqual(a.active, true);
			strictEqual(b.active, true);
			assertEvents(events, ["c3"]);
			strictEqual(isTracking(), false);
		});

		await ctx.test("uncapture expression", () => {
			const events: unknown[] = [];
			const signal = sig(42);
			uncapture(() => watch(() => {
				throws(() => {
					teardown(() => {});
				});
				uncapture(() => {
					teardown(() => {});
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

			strictEqual(isTracking(), false);
			uncapture(() => watch(() => {
				strictEqual(isTracking(), true);
				return a.value ? b.value : 0;
			}, value => {
				strictEqual(isTracking(), false);
				events.push(value);
			}));
			strictEqual(isTracking(), false);
			strictEqual(a.active, true);
			strictEqual(b.active, false);
			assertEvents(events, [0]);

			b.value = 3;
			strictEqual(a.active, true);
			strictEqual(b.active, false);
			assertEvents(events, []);

			a.value = true;
			strictEqual(a.active, true);
			strictEqual(b.active, true);
			assertEvents(events, [3]);

			b.value = 42;
			strictEqual(a.active, true);
			strictEqual(b.active, true);
			assertEvents(events, [42]);

			a.value = false;
			strictEqual(a.active, true);
			strictEqual(b.active, true);
			assertEvents(events, [0]);

			b.value = 2;
			strictEqual(a.active, true);
			strictEqual(b.active, false);
			assertEvents(events, []);

			a.value = true;
			strictEqual(a.active, true);
			strictEqual(b.active, true);
			assertEvents(events, [2]);
		});

		await ctx.test("teardown un-support", () => {
			const events: unknown[] = [];
			const signal = sig(1);

			strictEqual(isTracking(), false);
			uncapture(() => watch(() => {
				strictEqual(isTracking(), true);

				throws(() => {
					teardown(() => {});
				});
				throws(() => {
					watch(() => {}, () => {});
				});
				throws(() => {
					watchUpdates(() => {}, () => {});
				});
				throws(() => {
					effect(() => {});
				});

				return signal.value;
			}, value => {
				strictEqual(isTracking(), false);
				events.push(value);
			}));
			strictEqual(isTracking(), false);

			assertEvents(events, [1]);
			signal.value = 2;
			assertEvents(events, [2]);
		});

		await ctx.test("access isolation", () => {
			const events: unknown[] = [];
			const outer = sig(1);
			const inner = sig(1);
			let innerHook: TeardownHook | undefined;
			uncapture(() => {
				watch(() => {
					events.push("o");
					innerHook?.();
					innerHook = capture(() => {
						watch(() => {
							events.push("i");
							return inner.value;
						}, value => {
							events.push(`i${value}`);
						});
					});
					return outer.value;
				}, value => {
					events.push(`o${value}`);
				});
			});
			assertEvents(events, ["o", "i", "i1", "o1"]);
			inner.value++;
			assertEvents(events, ["i", "i2"]);
			outer.value++;
			assertEvents(events, ["o", "i", "i2", "o2"]);
		});

		await ctx.test("context", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			inject("test", 42, () => {
				uncapture(() => watch(() => {
					strictEqual(isTracking(), true);
					events.push(`e${extract("test")}`);
					strictEqual(isTracking(), true);
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
		strictEqual(signal.active, false);
		const dispose = capture(() => {
			const first = watchUpdates(signal, value => {
				events.push(value);
			});
			strictEqual(signal.active, true);
			strictEqual(first, "a");
		});
		assertEvents(events, []);
		signal.value = "b";
		strictEqual(signal.active, true);
		assertEvents(events, ["b"]);
		signal.value = "c";
		strictEqual(signal.active, true);
		assertEvents(events, ["c"]);
		dispose();
		strictEqual(signal.active, true);
		signal.value = "d";
		strictEqual(signal.active, false);
		assertEvents(events, []);
	});

	await ctx.test("tracking", async ctx => {
		await ctx.test("inert", () => {
			strictEqual(isTracking(), false);
			track(() => {
				strictEqual(isTracking(), false);
				untrack(() => {
					strictEqual(isTracking(), false);
					track(() => {
						strictEqual(isTracking(), false);
					});
				});
			});
		});

		await ctx.test("watch", () => {
			const events: unknown[] = [];
			const a = sig(0);
			const b = sig(0);
			uncapture(() => watch(() => {
				strictEqual(isTracking(), true);
				const result = a.value + untrack(() => {
					strictEqual(isTracking(), false);
					track(() => {
						strictEqual(isTracking(), true);
					});
					return b.value;
				});
				strictEqual(isTracking(), true);
				return result;
			}, value => {
				events.push(value);
			}));
			assertEvents(events, [0]);
			a.value++;
			assertEvents(events, [1]);
			b.value++;
			assertEvents(events, []);
			a.value++;
			assertEvents(events, [3]);
		});

		await ctx.test("trigger", () => {
			const events: unknown[] = [];
			const a = sig(1);
			const b = sig(2);
			const value = trigger(() => {
				strictEqual(isTracking(), true);
				const result = a.value + untrack(() => {
					strictEqual(isTracking(), false);
					track(() => {
						strictEqual(isTracking(), true);
					});
					return b.value;
				});
				strictEqual(isTracking(), true);
				return result;
			}, cycle => {
				events.push(cycle);
			}, 42);
			strictEqual(value, 3);
			assertEvents(events, []);
			b.value++;
			assertEvents(events, []);
			a.value++;
			assertEvents(events, [42]);
		});
	});

	await ctx.test("trigger", async ctx => {
		await ctx.test("behavior", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			strictEqual(signal.active, false);
			const value = trigger(() => {
				events.push(`?${signal.value}`);
				return signal.value;
			}, () => {
				events.push("trigger");
			});
			strictEqual(signal.active, true);
			strictEqual(value, 1);

			assertEvents(events, ["?1"]);

			signal.value = 7;
			strictEqual(signal.active, false);
			assertEvents(events, ["trigger"]);

			signal.value = 2;
			strictEqual(signal.active, false);
			assertEvents(events, []);
		});

		await ctx.test("nested triggers", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			strictEqual(signal.active, false);
			const value = trigger(() => {
				const inner = trigger(() => {
					events.push(`?${signal.value}`);
					return signal.value;
				}, () => {
					events.push("inner");
				});
				strictEqual(signal.active, true);
				return inner;
			}, () => {
				events.push("outer");
			});
			strictEqual(signal.active, true);
			strictEqual(value, 1);

			assertEvents(events, ["?1"]);

			signal.value = 7;
			strictEqual(signal.active, false);
			assertEvents(events, ["outer", "inner"]);

			signal.value = 2;
			strictEqual(signal.active, false);
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
				strictEqual(signal.active, false);
				trigger(signal, () => {
					events.push("a");
				});
				strictEqual(signal.active, true);
				assertEvents(events, []);
				signal.value = 2;
				strictEqual(signal.active, false);
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
			strictEqual(signal.active, true);
			assertEvents(events, []);
			batch(() => {
				strictEqual(signal.active, true);
				signal.value = 2;
				strictEqual(signal.active, false);
				assertEvents(events, ["a"]);
			});
			assertEvents(events, []);
		});
	});

	await ctx.test("memo", async ctx => {
		await ctx.test("watch", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			strictEqual(signal.active, false);
			strictEqual(isTracking(), false);

			uncapture(() => watch(memo(() => {
				strictEqual(isTracking(), true);
				events.push("e");
				return signal.value;
			}), value => {
				strictEqual(isTracking(), false);
				events.push(value);
			}));
			strictEqual(signal.active, true);

			assertEvents(events, ["e", 1]);
			signal.value = 2;
			strictEqual(signal.active, true);
			assertEvents(events, ["e", 2]);
			signal.notify();
			strictEqual(signal.active, true);
			assertEvents(events, ["e"]);
		});

		await ctx.test("dispose", () => {
			const signal = sig(1);

			let memoized!: () => number;
			const dispose = capture(() => {
				memoized = memo(signal);
				strictEqual(signal.active, true);
			});
			strictEqual(memoized(), 1);
			signal.value = 2;
			strictEqual(signal.active, true);
			strictEqual(memoized(), 2);

			dispose();
			strictEqual(signal.active, true);
			signal.value = 3;
			strictEqual(signal.active, false);
			strictEqual(memoized(), 2);
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
				assertEvents(events, []);
			});
			assertEvents(events, ["i", "o", 9]);
		});
	});

	await ctx.test("batch", () => {
		const events: unknown[] = [];
		const a = sig(0);
		const b = sig(1);
		uncapture(() => watch(() => {
			strictEqual(isTracking(), true);
			return a.value + b.value;
		}, value => {
			events.push(value);
		}));
		assertEvents(events, [1]);

		batch(() => {
			a.value++;
			b.value++;
			assertEvents(events, []);
		});
		assertEvents(events, [3]);

		batch(() => {
			a.value++;
			assertEvents(events, []);
			batch(() => {
				b.value++;
				assertEvents(events, []);
			});
			assertEvents(events, []);
		});
		assertEvents(events, [5]);

		batch(() => batch(() => {
			a.value++;
			b.value++;
			assertEvents(events, []);
			batch(() => {
				a.value++;
				b.value++;
				assertEvents(events, []);
			});
			assertEvents(events, []);
		}));
		assertEvents(events, [9]);

		batch(() => {
			a.value++;
			a.value++;
			assertEvents(events, []);
		});
		assertEvents(events, [11]);
	});

	await ctx.test("lazy", async ctx => {
		await ctx.test("behavior", () => {
			const events: unknown[] = [];
			const a = sig(2);
			const b = sig(3);

			const expr = lazy(() => {
				strictEqual(isTracking(), true);
				events.push("eval");
				return a.value * b.value;
			});
			strictEqual(a.active, false);
			strictEqual(b.active, false);
			assertEvents(events, []);

			const dispose = capture(() => {
				watch(expr, value => {
					strictEqual(isTracking(), false);
					events.push(`x${value}`);
				});
				strictEqual(a.active, true);
				strictEqual(b.active, true);
				assertEvents(events, ["eval", "x6"]);

				watch(expr, value => {
					strictEqual(isTracking(), false);
					events.push(`y${value}`);
				});
				strictEqual(a.active, true);
				strictEqual(b.active, true);
				assertEvents(events, ["y6"]);
			});

			a.value = 1;
			strictEqual(a.active, true);
			strictEqual(b.active, true);
			assertEvents(events, ["eval", "x3", "y3"]);

			dispose();
			strictEqual(a.active, true);
			strictEqual(b.active, true);
			assertEvents(events, []);

			b.value = 5;
			strictEqual(a.active, true);
			strictEqual(b.active, false);
			assertEvents(events, []);
		});

		await ctx.test("batch", () => {
			const events: unknown[] = [];
			const a = sig(2);
			const b = sig(3);

			const expr = lazy(() => {
				strictEqual(isTracking(), true);
				events.push("eval");
				return a.value * b.value;
			});
			assertEvents(events, []);

			uncapture(() => {
				watch(expr, value => {
					events.push(`x${value}`);
				});
				strictEqual(a.active, true);
				strictEqual(b.active, true);
				watch(expr, value => {
					events.push(`y${value}`);
				});
			});

			assertEvents(events, ["eval", "x6", "y6"]);

			batch(() => {
				strictEqual(isTracking(), false);
				a.value = 1;
				b.value = 4;
				strictEqual(a.active, false);
				strictEqual(b.active, false);
				assertEvents(events, []);
			});
			strictEqual(a.active, true);
			strictEqual(b.active, true);

			assertEvents(events, ["eval", "x4", "y4"]);
		});

		await ctx.test("trigger", () => {
			const events: unknown[] = [];
			const signal = sig(1);

			const expr = lazy(() => {
				strictEqual(isTracking(), true);
				events.push("eval");
				return signal.value;
			});
			strictEqual(signal.active, false);
			assertEvents(events, []);

			const value = trigger(expr, () => {
				events.push("a");
			});
			strictEqual(signal.active, true);
			strictEqual(value, 1);
			assertEvents(events, ["eval"]);

			signal.value = 2;
			strictEqual(signal.active, false);
			assertEvents(events, ["a"]);
		});

		await ctx.test("access cycles", () => {
			const events: unknown[] = [];
			const a = sig(false);
			const b = sig(42);

			const expr = lazy(() => {
				strictEqual(isTracking(), true);
				events.push("eval");
				return a.value ? b.value : 0;
			});
			strictEqual(a.active, false);
			strictEqual(b.active, false);
			assertEvents(events, []);

			uncapture(() => {
				watch(expr, value => {
					events.push(`x${value}`);
				});
				strictEqual(a.active, true);
				strictEqual(b.active, false);
				watch(expr, value => {
					events.push(`y${value}`);
				});
				strictEqual(a.active, true);
				strictEqual(b.active, false);
			});

			assertEvents(events, ["eval", "x0", "y0"]);

			b.value = 7;
			strictEqual(a.active, true);
			strictEqual(b.active, false);
			assertEvents(events, []);

			a.value = true;
			strictEqual(a.active, true);
			strictEqual(b.active, true);
			assertEvents(events, ["eval", "x7", "y7"]);

			b.value = 8;
			strictEqual(a.active, true);
			strictEqual(b.active, true);
			assertEvents(events, ["eval", "x8", "y8"]);

			a.value = false;
			strictEqual(a.active, true);
			strictEqual(b.active, true);
			assertEvents(events, ["eval", "x0", "y0"]);

			b.value = 3;
			strictEqual(a.active, true);
			strictEqual(b.active, false);
			assertEvents(events, []);
		});

		await ctx.test("inert & mixed usage", () => {
			const events: unknown[] = [];
			const signal = sig(1);

			const expr = lazy(() => {
				strictEqual(isTracking(), true);
				events.push("eval");
				return signal.value;
			});
			strictEqual(signal.active, false);
			assertEvents(events, []);

			strictEqual(expr(), 1);
			strictEqual(signal.active, true);
			assertEvents(events, ["eval"]);

			uncapture(() => watch(expr, value => {
				events.push(value);
			}));
			strictEqual(signal.active, true);
			assertEvents(events, [1]);

			signal.value = 2;
			strictEqual(signal.active, true);
			assertEvents(events, ["eval", 2]);
		});

		await ctx.test("lazy in batch with memos", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			const inner = uncapture(() => memo(() => {
				strictEqual(isTracking(), true);
				events.push("inner");
				return signal.value;
			}));
			strictEqual(signal.active, true);
			assertEvents(events, ["inner"]);
			const outer = lazy(() => {
				strictEqual(isTracking(), true);
				events.push("outer");
				return inner();
			});
			strictEqual(signal.active, true);
			assertEvents(events, []);
			uncapture(() => watch(outer, value => {
				events.push(value);
			}));
			strictEqual(signal.active, true);
			assertEvents(events, ["outer", 1]);
			batch(() => {
				signal.value = 2;
				strictEqual(signal.active, false);
				signal.value = 3;
				strictEqual(signal.active, false);
				assertEvents(events, []);
			});
			strictEqual(signal.active, true);
			assertEvents(events, ["inner", "outer", 3]);
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
