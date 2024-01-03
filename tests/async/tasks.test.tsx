import { strictEqual } from "node:assert";
import test from "node:test";

import { extract, inject, isPending, isSelfPending, Tasks, waitFor, watch, wrapContext } from "@mxjp/gluon";

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

		await inject(new Tasks(), () => {
			const outer = extract(Tasks);
			strictEqual(outer instanceof Tasks, true);

			inject(new Tasks(outer), () => {
				strictEqual(extract(Tasks)?.parent, outer);
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
});
