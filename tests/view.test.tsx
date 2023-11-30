import "./env.js";

import test from "node:test";
import { notStrictEqual, strictEqual, throws } from "node:assert";

import { View, capture, iter, map, nest, render, movable, sig, teardown, watch, when, show } from "@mxjp/gluon";
import { TestView, assertEvents, boundaryEvents, testView, text } from "./common.js";

await test("view", async ctx => {

	await ctx.test("init incomplete", () => {
		throws(() => new View(() => {}));
		throws(() => new View(setBoundary => {
			setBoundary(document.createTextNode("test"), undefined);
		}));
		throws(() => new View(setBoundary => {
			setBoundary(undefined, document.createTextNode("test"));
		}));
	});

	await ctx.test("init single node", () => {
		const view = new View(setBoundary => {
			const node = <div>test</div>;
			setBoundary(node, node);
		});

		strictEqual(view.parent, undefined);
		strictEqual(view.first, view.last);
		strictEqual(text(view.first), "test");
	});

	await ctx.test("init different nodes", () => {
		const { view } = testView();
		strictEqual(view.parent instanceof DocumentFragment, true);
		strictEqual(text(view.first), "f");
		strictEqual(text(view.last), "l");
	});

	await ctx.test("boundary owner", () => {
		const events: unknown[] = [];
		const view = testView();

		const unset = capture(() => {
			view.view.setBoundaryOwner(boundaryEvents(events));
		});
		assertEvents(events, []);

		const a = view.nextFirst();
		strictEqual(view.view.first, a);
		assertEvents(events, ["f0l"]);

		const b = view.nextLast();
		strictEqual(view.view.last, b);
		assertEvents(events, ["f0l1"]);

		throws(() => view.view.setBoundaryOwner(() => {}));
		unset();
		view.view.setBoundaryOwner(() => {});

		const c = view.nextFirst();
		strictEqual(view.view.first, c);
		const d = view.nextLast();
		strictEqual(view.view.last, d);
		assertEvents(events, []);
	});

	await ctx.test("take single node", () => {
		let node!: Node;
		let parent!: Node;
		const view = new View(setBoundary => {
			node = <div>test</div>;
			parent = <div>{node}</div>;
			setBoundary(node, node);
		});
		strictEqual(node.parentNode, parent);
		strictEqual(node, view.take());
		strictEqual(node.parentNode, parent);
	});

	await ctx.test("detach single node", () => {
		let node!: Node;
		let parent!: Node;
		const view = new View(setBoundary => {
			node = <div>test</div>;
			parent = <div>{node}</div>;
			setBoundary(node, node);
		});
		strictEqual(node.parentNode, parent);
		view.detach();
		strictEqual(node.parentNode, null);
	});

	await ctx.test("take multiple nodes", () => {
		const { view } = testView();
		const frag = view.take();
		strictEqual(frag instanceof DocumentFragment, true);
		strictEqual(view.first, frag.firstChild);
		strictEqual(view.last, frag.lastChild);
	});

	await ctx.test("detach multiple nodes", () => {
		const { view } = testView();
		const parent = view.parent;
		view.detach();
		strictEqual(view.first.parentNode instanceof DocumentFragment, true);
		strictEqual(view.first.parentNode, view.last.parentNode);
		notStrictEqual(view.first.parentNode, parent);
	});

	await ctx.test("nest", async ctx => {

		await ctx.test("lifecycle", () => {
			const events: unknown[] = [];
			const signal = sig(0);

			let view!: View;
			const dispose = capture(() => {
				view = nest(() => {
					const value = signal.value;
					if (value === 0) {
						return undefined;
					}
					return () => {
						events.push(`+${value}`);
						teardown(() => {
							events.push(`-${value}`);
						});
						return <div>{value}</div>;
					};
				});
			});

			strictEqual(text(view.take()), "");
			assertEvents(events, []);

			signal.value = 1;
			strictEqual(text(view.take()), "1");
			assertEvents(events, ["+1"]);

			signal.value = 2;
			strictEqual(text(view.take()), "2");
			assertEvents(events, ["-1", "+2"]);

			dispose();
			assertEvents(events, ["-2"]);
		});

		await ctx.test("boundary", () => {
			const events: unknown[] = [];

			const inner = sig<TestView | undefined>(undefined);

			let view!: View;
			const dispose = capture(() => {
				view = nest(() => {
					const view = inner.value?.view;
					return () => view;
				});
				view.setBoundaryOwner(boundaryEvents(events));
			});

			strictEqual(text(view.take()), "");

			inner.value = testView("a");
			strictEqual(text(view.take()), "afl");
			assertEvents(events, ["afl"]);

			inner.value.nextFirst();
			strictEqual(text(view.take()), "af0l");
			assertEvents(events, ["af0l"]);

			inner.value.nextLast();
			strictEqual(text(view.take()), "af0l1");
			assertEvents(events, ["af0l1"]);

			inner.value = testView("b");
			strictEqual(text(view.take()), "bfl");
			assertEvents(events, ["bfl"]);

			inner.value = undefined;
			strictEqual(text(view.take()), "");
			assertEvents(events, [""]);
		});

	});

	await ctx.test("when", () => {
		const events: unknown[] = [];

		const signal = sig(0, false);
		const view = when(signal, value => {
			events.push(`+${value}`);
			teardown(() => {
				events.push(`-${value}`);
			});
			return value;
		}, () => {
			events.push("+f");
			teardown(() => {
				events.push("-f");
			});
			return "f";
		});

		strictEqual(text(view.take()), "f");
		assertEvents(events, ["+f"]);

		signal.value = 1;
		strictEqual(text(view.take()), "1");
		assertEvents(events, ["-f", "+1"]);

		capture(() => {
			watch(signal, value => void events.push(`e${value}`));
			assertEvents(events, ["e1"]);

			signal.value = 2;
			strictEqual(text(view.take()), "2");
			assertEvents(events, ["-1", "+2", "e2"]);

			signal.value = 2;
			strictEqual(text(view.take()), "2");
			assertEvents(events, ["e2"]);
		})();

		signal.value = 0;
		strictEqual(text(view.take()), "f");
		assertEvents(events, ["-2", "+f"]);

		capture(() => {
			watch(signal, value => void events.push(`e${value}`));
			assertEvents(events, ["e0"]);

			signal.value = 0;
			strictEqual(text(view.take()), "f");
			assertEvents(events, ["e0"]);
		})();
	});

	await ctx.test("map", async ctx => {

		function sequenceTest(sequence: unknown[][]) {
			const events: unknown[] = [];
			const signal = sig(sequence[0]);

			const view = map(signal, (value, index) => {
				events.push(`+${value}`);
				teardown(() => {
					events.push(`-${value}`);
				});
				return <>[{value}:{index}]</>;
			});

			let lastValues = new Set<unknown>();
			function assertItems(values: unknown[]) {
				strictEqual(text(view.take()), [...new Set(values)].map((v, i) => `[${v}:${i}]`).join(""));

				const expectedEvents = [];
				const valueSet = new Set(values);
				for (const value of valueSet) {
					if (!lastValues.has(value)) {
						expectedEvents.push(`+${value}`);
					}
				}
				for (const value of lastValues) {
					if (!valueSet.has(value)) {
						expectedEvents.push(`-${value}`);
					}
				}
				lastValues = valueSet;
				assertEvents(events.sort(), expectedEvents.sort());
			}

			assertItems(sequence[0]);
			for (let i = 1; i < sequence.length; i++) {
				signal.value = sequence[i];
				assertItems(sequence[i]);
			}
		}

		await ctx.test("diff", () => {
			sequenceTest([
				// Initial items:
				[1, 2, 3, 4, 5],
				// Remove boundary & middle parts:
				[2, 4],
				// Shuffle & insert:
				[1, 4, 3, 2, 5],
				// Remove all:
				[],
				// Re-insert items:
				[1, 2, 3, 4, 5],
				// Shuffle & remove:
				[5, 3, 1],
				// Remove and insert new:
				[2, 4],
				// Insert many:
				[1, 2, 3, 4, 5, 6, 7],
				// Shuffle, insert & remove:
				[2, 9, 10, 7, 8, 1, 5],
				// Remove & insert duplicates:
				[2, 2, 1, 1, 5, 5],
				// Shuffle & insert mixed duplicates:
				[2, 1, 5, 3, 2, 1, 3, 5, 2, 5, 1],
				// Shuffle & remove duplicates only:
				[3, 5, 1, 2],
			]);
		});

		await ctx.test("diff (random fuzzing)", ctx => {
			const SEQ_SIZE = 100;
			const MAX_COUNT = 20;
			const MAX_OFFSET = 8;
			const MAX_DUPLICATES = 4;

			const sequence: unknown[][] = [];
			for (let i = 0; i < SEQ_SIZE; i++) {
				const count = Math.floor(Math.random() * MAX_COUNT);
				const offset = Math.floor(Math.random() * MAX_OFFSET);
				const duplicates = Math.floor(Math.random() * MAX_DUPLICATES);
				const values: unknown[] = [];
				for (let c = 0; c < count; c++) {
					values.splice(Math.floor(Math.random() * (values.length + 1)), 0, c + offset);
				}
				if (count > 0) {
					for (let d = 0; d < duplicates; d++) {
						const value = values[Math.floor(Math.random() * values.length)];
						values.splice(Math.floor(Math.random() * (values.length + 1)), 0, value);
					}
				}
				sequence.push(values);
			}

			try {
				sequenceTest(sequence);
			} catch (error) {
				ctx.diagnostic(`Broken sequence: ${JSON.stringify(sequence)}`);
				throw error;
			}
		})

	});

	await ctx.test("iter", async ctx => {

		function sequenceTest(sequence: unknown[][]) {
			const events: unknown[] = [];
			const signal = sig(sequence[0]);

			const view = iter(signal, (value, index) => {
				events.push(`+${value}`);
				teardown(() => {
					events.push(`-${value}`);
				});
				return <>[{value}:{index}]</>;
			});

			let lastValues: unknown[] = [];
			function assertItems(values: unknown[]) {
				strictEqual(text(view.take()), values.map((v, i) => `[${v}:${i}]`).join(""));
				const expectedEvents: unknown[] = [];
				for (let i = 0; i < values.length; i++) {
					if (i < lastValues.length) {
						const last = lastValues[i];
						if (last === values[i]) {
							continue;
						}
						expectedEvents.push(`-${last}`);
					}
					expectedEvents.push(`+${values[i]}`);
				}
				for (let i = values.length; i < lastValues.length; i++) {
					expectedEvents.push(`-${lastValues[i]}`);
				}
				assertEvents(events, expectedEvents);
				lastValues = values;
			}

			assertItems(sequence[0]);
			for (let i = 1; i < sequence.length; i++) {
				signal.value = sequence[i];
				assertItems(sequence[i]);
			}
		}

		await ctx.test("diff", () => {
			sequenceTest([
				[1, 2, 3],
				[1, 4, 3],
				[1, 4],
				[2, 4, 5, 6],
				[1, 2, 3],
				[],
			]);
		});

	});

	await ctx.test("movable", async () => {
		const inner = sig(1);
		const view = movable(<>
			inner: {inner}
		</>);

		const a = render(view.move());
		strictEqual(text(a.take()), "inner: 1");

		const b = render(view.move());
		strictEqual(text(a.take()), "");
		strictEqual(a.first instanceof Comment, true);
		strictEqual(a.first, a.last);
		strictEqual(text(b.take()), "inner: 1");
		inner.value = 2;
		strictEqual(text(b.take()), "inner: 2");

		view.detach();
		inner.value = 3;
		strictEqual(text(b.take()), "");
		strictEqual(b.first instanceof Comment, true);
		strictEqual(b.first, b.last);
		notStrictEqual(a.first, b.first);

		const c = render(view.move());
		strictEqual(text(c.take()), "inner: 3");
	});

	await ctx.test("show", async () => {
		const signal = sig(false);
		const inner = sig(1);

		const view = show(signal, <>
			inner: {inner}
		</>);

		inner.value = 2;
		strictEqual(text(view.take()), "");
		signal.value = true;
		strictEqual(text(view.take()), "inner: 2");
		inner.value = 3;
		strictEqual(text(view.take()), "inner: 3");
		signal.value = false;
		strictEqual(text(view.take()), "");
		inner.value = 4;
		strictEqual(text(view.take()), "");
		signal.value = true;
		strictEqual(text(view.take()), "inner: 4");
	});

});
