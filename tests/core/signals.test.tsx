import { deepStrictEqual, strictEqual, throws } from "node:assert";
import test from "node:test";

import { batch, capture, effect, extract, get, inject, isTracking, map, memo, optionalString, sig, string, teardown, TeardownHook, track, trigger, TriggerPipe, uncapture, untrack, watch, watchUpdates } from "@mxjp/gluon";

import { assertEvents, lifecycleEvent, withMsg } from "../common.js";

await test("signals", async ctx => {
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

	await ctx.test("immediate side effects", async ctx => {
		await test("watch", () => {
			const events: unknown[] = [];
			const signal = sig(0);
			const dispose = capture(() => {
				watch(signal, value => {
					lifecycleEvent(events, `${value}`);
					if (signal.value < 3) {
						signal.value++;
					}
				});
			});
			assertEvents(events, ["s:0", "e:0", "s:1", "e:1", "s:2", "e:2", "s:3"]);
			dispose();
			assertEvents(events, ["e:3"]);
		});

		await test("watch (duplicate updates)", () => {
			const events: unknown[] = [];
			const signal = sig(0);
			const dispose = capture(() => {
				watch(signal, value => {
					lifecycleEvent(events, `${value}`);
					if (signal.value < 5) {
						signal.value++;
						signal.value++;
					}
				});
			});
			assertEvents(events, ["s:0", "e:0", "s:2", "e:2", "s:4", "e:4", "s:6"]);
			dispose();
			assertEvents(events, ["e:6"]);
		});

		await test("watch (multiple signals)", () => {
			const events: unknown[] = [];
			const a = sig(0);
			const b = sig(0);
			const dispose = capture(() => {
				watch(() => a.value + b.value, value => {
					lifecycleEvent(events, `${value}`);
					if (value < 5) {
						a.value++;
						b.value++;
					}
				});
			});
			assertEvents(events, ["s:0", "e:0", "s:2", "e:2", "s:4", "e:4", "s:6"]);
			dispose();
			assertEvents(events, ["e:6"]);
		});

		await ctx.test("effect", () => {
			const events: unknown[] = [];
			const signal = sig(0);
			const dispose = capture(() => {
				effect(() => {
					lifecycleEvent(events, `${signal.value}`);
					if (signal.value < 3) {
						signal.value++;
					}
				});
			});
			assertEvents(events, ["s:0", "e:0", "s:1", "e:1", "s:2", "e:2", "s:3"]);
			dispose();
			assertEvents(events, ["e:3"]);
		});

		await test("effect (duplicate updates)", () => {
			const events: unknown[] = [];
			const signal = sig(0);
			const dispose = capture(() => {
				effect(() => {
					lifecycleEvent(events, `${signal.value}`);
					if (signal.value < 5) {
						signal.value++;
						signal.value++;
					}
				});
			});
			assertEvents(events, ["s:0", "e:0", "s:2", "e:2", "s:4", "e:4", "s:6"]);
			dispose();
			assertEvents(events, ["e:6"]);
		});

		await test("effect (multiple signals)", () => {
			const events: unknown[] = [];
			const a = sig(0);
			const b = sig(0);
			const dispose = capture(() => {
				effect(() => {
					const value = a.value + b.value;
					lifecycleEvent(events, `${value}`);
					if (value < 5) {
						a.value++;
						b.value++;
					}
				});
			});
			assertEvents(events, ["s:0", "e:0", "s:2", "e:2", "s:4", "e:4", "s:6"]);
			dispose();
			assertEvents(events, ["e:6"]);
		});
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
		strictEqual(b.active, false);
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

	await ctx.test("same values", () => {
		const events: unknown[] = [];
		const signal = sig(42);
		uncapture(() => watch(signal, value => {
			events.push(value);
		}));
		assertEvents(events, [42]);
		signal.value = 7;
		assertEvents(events, [7]);
		signal.value = 7;
		assertEvents(events, []);
		signal.value = NaN;
		assertEvents(events, [NaN]);
		signal.value = NaN;
		assertEvents(events, []);
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
			strictEqual(signal.active, false);
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
				strictEqual(a.active, true);
				strictEqual(b.active, true);
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
				}, withMsg("G0"));
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

		await ctx.test("teardown un-support", () => {
			const events: unknown[] = [];
			const signal = sig(1);

			strictEqual(isTracking(), false);
			uncapture(() => watch(() => {
				strictEqual(isTracking(), true);

				throws(() => {
					teardown(() => {});
				}, withMsg("G0"));
				throws(() => {
					watch(() => {}, () => {});
				}, withMsg("G0"));
				throws(() => {
					watchUpdates(() => {}, () => {});
				}, withMsg("G0"));
				throws(() => {
					effect(() => {});
				}, withMsg("G0"));

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

		for (const inExpr of [false, true]) {
			await ctx.test(`${inExpr ? "expression" : "callback"} error handling`, async ctx => {
				await ctx.test("immediate, no access", () => {
					uncapture(() => {
						throws(() => {
							watch(() => {
								if (inExpr) {
									throw new Error("e");
								}
							}, () => {
								throw new Error("c");
							});
						}, withMsg(inExpr ? "e" : "c"));
					});
				});

				await ctx.test("immediate, access", () => {
					const events: unknown[] = [];
					const signal = sig(42);
					const dispose = capture(() => {
						watch(signal, value => {
							events.push(`a${value}`);
						});

						throws(() => {
							watch(() => {
								signal.access();
								if (inExpr) {
									throw new Error("e");
								}
							}, () => {
								throw new Error("c");
							});
						}, withMsg(inExpr ? "e" : "c"));

						watch(signal, value => {
							events.push(`b${value}`);
						});

						assertEvents(events, ["a42", "b42"]);
					});

					throws(() => {
						signal.value = 77;
					}, withMsg(inExpr ? "e" : "c"));
					assertEvents(events, ["a77"]);

					throws(() => {
						signal.value = 11;
					}, withMsg(inExpr ? "e" : "c"));
					assertEvents(events, ["a11"]);

					dispose();
					signal.value = 123;
					assertEvents(events, []);
				});

				await ctx.test("deferred, access", () => {
					const events: unknown[] = [];
					const signal = sig(42);

					const dispose = capture(() => {
						watch(() => {
							if (signal.value === 77 && inExpr) {
								throw new Error("e");
							}
							return signal.value;
						}, value => {
							if (value === 77) {
								throw new Error("c");
							}
							events.push(`v${value}`);
						});

						assertEvents(events, ["v42"]);
					});

					throws(() => {
						signal.value = 77;
					}, withMsg(inExpr ? "e" : "c"));

					assertEvents(events, []);

					signal.value = 123;
					assertEvents(events, ["v123"]);

					dispose();
					signal.value = 1234;
					assertEvents(events, []);
				});
			});
		}
	});

	await ctx.test("effect", async ctx => {
		await ctx.test("normal usage", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			const dispose = capture(() => {
				effect(() => {
					strictEqual(isTracking(), true);
					const value = signal.value;
					events.push(`s${value}`);
					teardown(() => {
						events.push(`e${value}`);
					});
				});
			});
			strictEqual(isTracking(), false);
			assertEvents(events, ["s1"]);
			signal.value++;
			assertEvents(events, ["e1", "s2"]);
			signal.value++;
			assertEvents(events, ["e2", "s3"]);
			dispose();
			assertEvents(events, ["e3"]);
			signal.value++;
			assertEvents(events, []);
		});

		await ctx.test("batch", () => {
			const events: unknown[] = [];
			const a = sig("a");
			const b = sig(1);
			uncapture(() => {
				effect(() => {
					events.push(`${a.value}${b.value}`);
				});
			});
			assertEvents(events, ["a1"]);
			batch(() => {
				a.value = "b";
				assertEvents(events, []);
				b.value++;
				assertEvents(events, []);
			});
			assertEvents(events, ["b2"]);
		});

		await ctx.test("access isolation", () => {
			const events: unknown[] = [];
			const outer = sig(1);
			const inner = sig(1);
			uncapture(() => {
				effect(() => {
					events.push(`o${outer.value}`);
					effect(() => {
						events.push(`i${inner.value}`);
					});
				});
			});
			assertEvents(events, ["o1", "i1"]);
			outer.value++;
			assertEvents(events, ["o2", "i1"]);
			inner.value++;
			assertEvents(events, ["i2"]);
			outer.value++;
			assertEvents(events, ["o3", "i2"]);
			inner.value++;
			assertEvents(events, ["i3"]);
		});

		await ctx.test("expected infinite loop", () => {
			let count = 0;
			const signal = sig(0);
			uncapture(() => {
				effect(() => {
					if (count < 5) {
						count++;
						signal.value++;
					}
				});
			});
			strictEqual(count, 5);
		});

		await ctx.test("error handling", async ctx => {
			await ctx.test("immediate, no access", () => {
				uncapture(() => {
					throws(() => {
						effect(() => {
							throw new Error("test");
						});
					}, withMsg("test"));
				});
			});

			await ctx.test("immediate, access", () => {
				const events: unknown[] = [];
				const signal = sig(42);
				const dispose = capture(() => {
					effect(() => {
						events.push(`a${signal.value}`);
					});

					throws(() => {
						effect(() => {
							signal.access();
							throw new Error("test");
						});
					}, withMsg("test"));

					effect(() => {
						events.push(`b${signal.value}`);
					});

					assertEvents(events, ["a42", "b42"]);
				});

				throws(() => {
					signal.value = 77;
				}, withMsg("test"));
				assertEvents(events, ["a77"]);

				throws(() => {
					signal.value = 11;
				}, withMsg("test"));
				assertEvents(events, ["a11"]);

				dispose();
				signal.value = 123;
				assertEvents(events, []);
			});
		});
	});

	await ctx.test("watchUpdates", () => {
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
		strictEqual(signal.active, false);
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
			strictEqual(signal.active, false);
			signal.value = 3;
			strictEqual(signal.active, false);
			strictEqual(memoized(), 2);
		});

		for (const useBatch of [false, true]) {
			const batchType = useBatch ? "batch" : "non-batch";

			await ctx.test(`${batchType} + memos + non-memos in same dependant`, () => {
				const events: unknown[] = [];
				const signal = sig(1);
				const computed = uncapture(() => memo(() => signal.value * 2));
				uncapture(() => watch(() => [signal.value, computed()], value => {
					events.push(value);
				}));
				assertEvents(events, [[1, 2]]);
				if (useBatch) {
					batch(() => {
						signal.value++;
						assertEvents(events, []);
					});
				} else {
					signal.value++;
				}
				assertEvents(events, useBatch ? [[2, 4]] : [[2, 4], [2, 4]]);
			});

			await ctx.test(`${batchType} + memos + non-memos in distinct dependants`, () => {
				const events: unknown[] = [];
				const signal = sig(1);
				const computed = uncapture(() => memo(() => signal.value * 2));
				uncapture(() => watch(() => signal.value, value => {
					events.push(["signal", value]);
				}));
				uncapture(() => watch(computed, value => {
					events.push(["memo", value]);
				}));
				assertEvents(events, [["signal", 1], ["memo", 2]]);
				if (useBatch) {
					batch(() => {
						signal.value++;
						assertEvents(events, []);
					});
				} else {
					signal.value++;
				}
				assertEvents(events.toSorted(), [["memo", 4], ["signal", 2]]);
			});
		}

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
			assertEvents(events, ["i", "o", 6, "o"]);

			batch(() => {
				signal.value = 3;
				assertEvents(events, []);
			});
			assertEvents(events, ["i", "o", 9]);
		});

		await ctx.test("error handling", () => {
			const events: unknown[] = [];
			const signal = sig(42);

			const computed = uncapture(() => memo(() => {
				if (signal.value === 77) {
					throw new Error("test");
				}
				return signal.value + 1;
			}));

			uncapture(() => {
				watch(computed, value => {
					events.push(value);
				});
			});
			assertEvents(events, [43]);
			strictEqual(computed(), 43);

			throws(() => {
				signal.value = 77;
			}, withMsg("test"));
			assertEvents(events, []);
			strictEqual(computed(), 43);

			signal.value = 123;
			assertEvents(events, [124]);
			strictEqual(computed(), 124);
		});
	});

	await ctx.test("batch", async ctx => {
		await ctx.test("usage", () => {
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

		await ctx.test("error handling", () => {
			const events: unknown[] = [];
			const signal = sig(42);
			uncapture(() => watch(signal, value => {
				events.push(value);
			}));
			assertEvents(events, [42]);

			throws(() => {
				batch(() => {
					signal.value = 77;
					throw new Error("test");
				});
			}, withMsg("test"));

			strictEqual(signal.value, 77);
			assertEvents(events, []);

			signal.value = 2;
			strictEqual(signal.value, 2);
			assertEvents(events, [2]);

			batch(() => {
				throws(() => {
					batch(() => {
						signal.value = 11;
						throw new Error("test");
					});
				}, withMsg("test"));

				strictEqual(signal.value, 11);
				assertEvents(events, []);
			});
			assertEvents(events, [11]);

			signal.value = 3;
			strictEqual(signal.value, 3);
			assertEvents(events, [3]);
		});

		await ctx.test("disposed watch", () => {
			const events: unknown[] = [];
			const signal = sig(42);
			const dispose = capture(() => watch(signal, value => {
				events.push("a", value);
			}));
			uncapture(() => watch(signal, value => {
				events.push("b", value);
			}));
			assertEvents(events, ["a", 42, "b", 42]);
			batch(() => {
				signal.value = 77;
				dispose();
			});
			assertEvents(events, ["b", 77]);
		});

		await ctx.test("disposed effect", () => {
			const events: unknown[] = [];
			const signal = sig(42);
			const dispose = capture(() => effect(() => {
				events.push("a", signal.value);
			}));
			uncapture(() => effect(() => {
				events.push("b", signal.value);
			}));
			assertEvents(events, ["a", 42, "b", 42]);
			batch(() => {
				signal.value = 77;
				dispose();
			});
			assertEvents(events, ["b", 77]);
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

	await ctx.test("trigger", async ctx => {
		await ctx.test("usage & lifecycle", () => {
			const events: unknown[] = [];
			const signalA = sig(42);
			const signalB = sig(1);

			let pipe!: TriggerPipe;
			const dispose = capture(() => {
				pipe = trigger(() => {
					events.push("trigger");
				});
			});

			strictEqual(signalA.active, false);
			strictEqual(pipe(() => {
				events.push("pipe");
				strictEqual(isTracking(), true);
				return signalA.value;
			}), 42);
			strictEqual(signalA.active, true);
			assertEvents(events, ["pipe"]);

			signalA.value = 13;
			assertEvents(events, ["trigger"]);
			strictEqual(signalA.active, false);

			signalA.value = 77;
			assertEvents(events, []);
			strictEqual(signalA.active, false);

			strictEqual(pipe(() => signalA.value), 77);
			strictEqual(signalA.active, true);

			strictEqual(pipe(() => signalB.value), 1);
			strictEqual(signalA.active, false);
			strictEqual(signalB.active, true);

			signalA.value = 123;
			assertEvents(events, []);
			signalB.value = 2;
			assertEvents(events, ["trigger"]);

			strictEqual(pipe(() => signalB.value), 2);
			strictEqual(signalB.active, true);

			dispose();
			strictEqual(signalB.active, false);

			signalB.value = 3;
			assertEvents(events, []);
			strictEqual(signalB.active, false);
		});

		await ctx.test("distinct update order, pre+post", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			uncapture(() => watch(signal, () => events.push("a")));
			const pipe = uncapture(() => trigger(() => events.push("t")));
			strictEqual(pipe(signal), 1);
			uncapture(() => watch(signal, () => events.push("b")));
			assertEvents(events, ["a", "b"]);
			signal.value = 2;
			assertEvents(events, ["a", "t", "b"]);
			signal.value = 3;
			assertEvents(events, ["a", "b"]);
		});

		await ctx.test("distinct update order, pre", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			const pipe = uncapture(() => trigger(() => events.push("t")));
			strictEqual(pipe(signal), 1);
			uncapture(() => watch(signal, () => events.push("a")));
			uncapture(() => watch(signal, () => events.push("b")));
			assertEvents(events, ["a", "b"]);
			signal.value = 2;
			assertEvents(events, ["t", "a", "b"]);
			signal.value = 3;
			assertEvents(events, ["a", "b"]);
		});

		await ctx.test("distinct update order, post", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			uncapture(() => watch(signal, () => events.push("a")));
			uncapture(() => watch(signal, () => events.push("b")));
			const pipe = uncapture(() => trigger(() => events.push("t")));
			strictEqual(pipe(signal), 1);
			assertEvents(events, ["a", "b"]);
			signal.value = 2;
			assertEvents(events, ["a", "b", "t"]);
			signal.value = 3;
			assertEvents(events, ["a", "b"]);
		});

		await ctx.test("nested update order", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			const pipeA = uncapture(() => trigger(() => events.push("a")));
			const pipeB = uncapture(() => trigger(() => events.push("b")));
			uncapture(() => watch(() => {
				return pipeA(() => {
					return pipeB(() => {
						return signal.value;
					});
				});
			}, value => {
				events.push("update", value);
			}));
			assertEvents(events, ["update", 1]);
			signal.value = 2;
			assertEvents(events, ["b", "a", "update", 2]);
			signal.value = 3;
			assertEvents(events, ["b", "a", "update", 3]);
		});

		await ctx.test("implicit update disposal", () => {
			const events: unknown[] = [];
			const signalA = sig(1);
			const signalB = sig(2);
			const pipe = uncapture(() => trigger(() => events.push("t")));
			strictEqual(pipe(() => signalA.value + signalB.value), 3);
			assertEvents(events, []);

			signalA.value = 3;
			assertEvents(events, ["t"]);
			signalB.value = 4;
			assertEvents(events, []);

			strictEqual(pipe(() => signalB.value + signalA.value), 7);
			signalA.value = 5;
			assertEvents(events, ["t"]);
			signalB.value = 6;
			assertEvents(events, []);
			signalA.value = 7;
			assertEvents(events, []);
		});

		await ctx.test("batch", () => {
			const events: unknown[] = [];
			const signalA = sig(1);
			const signalB = sig(2);
			const pipe = uncapture(() => trigger(() => events.push("t")));
			strictEqual(pipe(() => signalA.value + signalB.value), 3);
			assertEvents(events, []);

			batch(() => {
				signalA.value = 3;
				assertEvents(events, []);
			});
			assertEvents(events, ["t"]);
			signalB.value = 4;
			assertEvents(events, []);

			strictEqual(pipe(() => signalA.value + signalB.value), 7);
			batch(() => {
				signalA.value = 5;
				signalB.value = 6;
				assertEvents(events, []);
			});
			assertEvents(events, ["t"]);

			signalA.value = 7;
			signalB.value = 8;
			assertEvents(events, []);
		});

		await ctx.test("nested + batch", () => {
			const events: unknown[] = [];
			const signal = sig(1);
			const pipe = uncapture(() => trigger(() => events.push("t")));
			uncapture(() => watch(() => {
				return pipe(() => {
					return signal.value;
				});
			}, value => {
				events.push(value);
			}));
			assertEvents(events, [1]);
			batch(() => {
				signal.value = 2;
				assertEvents(events, []);
			});
			assertEvents(events, ["t", 2]);
			batch(() => {
				signal.value = 3;
				signal.value = 4;
				assertEvents(events, []);
			});
			assertEvents(events, ["t", 4]);
		});
	});
});
