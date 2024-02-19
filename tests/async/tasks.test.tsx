import "../env.js";

import { strictEqual } from "node:assert";
import test from "node:test";

import { capture, extract, inject, isPending, isSelfPending, mount, TASKS, Tasks, waitFor, watch, wrapContext } from "@mxjp/gluon";

import { assertEvents, future } from "../common.js";

await test("async/tasks", async ctx => {
	await ctx.test("waitFor", async () => {
		const parent = new Tasks();
		const inner = new Tasks(parent);
		strictEqual(parent.pending, false);
		strictEqual(parent.selfPending, false);
		strictEqual(inner.pending, false);
		strictEqual(inner.selfPending, false);

		const [a, resolveA] = future();
		parent.waitFor(a);
		strictEqual(parent.pending, true);
		strictEqual(parent.selfPending, true);
		strictEqual(inner.pending, true);
		strictEqual(inner.selfPending, false);

		resolveA();
		await Promise.resolve();
		strictEqual(parent.pending, false);
		strictEqual(parent.selfPending, false);
		strictEqual(inner.pending, false);
		strictEqual(inner.selfPending, false);
	});

	await ctx.test("setPending", async () => {
		const tasks = new Tasks();
		strictEqual(tasks.pending, false);
		const dispose = capture(() => tasks.setPending());
		strictEqual(tasks.pending, true);
		dispose();
		strictEqual(tasks.pending, false);
	});

	await ctx.test("multiple tasks", async () => {
		const [a, resolveA] = future();
		const [b, resolveB] = future();
		const tasks = new Tasks();
		tasks.waitFor(a);
		tasks.waitFor(b);
		strictEqual(tasks.pending, true);
		strictEqual(tasks.selfPending, true);
		resolveA();
		await Promise.resolve();
		strictEqual(tasks.pending, true);
		strictEqual(tasks.selfPending, true);
		resolveB();
		await Promise.resolve();
		strictEqual(tasks.pending, false);
		strictEqual(tasks.selfPending, false);
	});

	await ctx.test("error handling", async () => {
		const tasks = new Tasks();
		const [a,, rejectA] = future();
		tasks.waitFor(a);
		strictEqual(tasks.pending, true);
		strictEqual(tasks.selfPending, true);
		rejectA(undefined);
		await Promise.resolve();
		strictEqual(tasks.pending, false);
		strictEqual(tasks.selfPending, false);
	});

	await ctx.test("tracking", async () => {
		const events: unknown[] = [];
		const tasks = new Tasks();
		watch(() => tasks.pending, pending => {
			events.push(pending);
		});
		watch(() => tasks.selfPending, selfPending => {
			events.push(selfPending);
		});
		assertEvents(events, [false, false]);

		const [a, resolveA] = future();
		tasks.waitFor(a);
		assertEvents(events, [true, true]);

		resolveA();
		await Promise.resolve();
		assertEvents(events, [false, false]);
	});

	await ctx.test("context api", async () => {
		strictEqual(isPending(), false);
		strictEqual(isSelfPending(), false);

		await inject(TASKS, new Tasks(), () => {
			const outer = extract(TASKS);
			strictEqual(outer instanceof Tasks, true);

			inject(TASKS, new Tasks(outer), () => {
				strictEqual(extract(TASKS)?.parent, outer);
			});

			const [a, resolveA] = future();
			waitFor(a);

			strictEqual(isPending(), true);
			strictEqual(isSelfPending(), true);

			return Promise.resolve()
				.then(wrapContext(() => {
					strictEqual(isPending(), true);
					strictEqual(isSelfPending(), true);
				}))
				.then(resolveA)
				.then(wrapContext(() => {
					strictEqual(isPending(), false);
					strictEqual(isSelfPending(), false);
				}));
		});
	});

	await ctx.test("manage focus", async () => {
		const input = <input /> as HTMLInputElement;
		const dispose = capture(() => mount(document.body, input));
		try {
			const tasks = new Tasks();

			input.focus();
			strictEqual(document.activeElement, input);

			const done = capture(() => tasks.setPending());

			input.blur();
			strictEqual(document.activeElement, document.body);

			done();
			strictEqual(document.activeElement, input);
		} finally {
			dispose();
		}
		strictEqual(document.activeElement, document.body);
	});
});
