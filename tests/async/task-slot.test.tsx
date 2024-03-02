import { strictEqual } from "node:assert";
import test from "node:test";

import { TaskSlot } from "@mxjp/gluon";

import { assertEvents } from "../common.js";

await test("async/task-slot", async ctx => {
	await ctx.test("sync side effect", () => {
		const events: unknown[] = [];
		const slot = new TaskSlot();
		slot.sideEffect(signal => {
			events.push(0);
			strictEqual(signal.aborted, false);
			events.push(1);
		});
		events.push(2);
		assertEvents(events, [0, 1, 2]);
	});

	await ctx.test("sync blocking", () => {
		const events: unknown[] = [];
		const slot = new TaskSlot();
		void slot.block(() => {
			events.push(0);
		});
		events.push(1);
		assertEvents(events, [0, 1]);
	});

	await ctx.test("abort side effect", async () => {
		const events: unknown[] = [];
		const slot = new TaskSlot();
		slot.sideEffect(async signal => {
			events.push(0);
			await Promise.resolve();
			events.push(1, signal.aborted);
		});
		events.push(2);
		slot.sideEffect(() => {});
		await Promise.resolve();
		assertEvents(events, [0, 2, 1, true]);
	});

	await ctx.test("dequeue side effect & run most recent", async () => {
		const events: unknown[] = [];
		const slot = new TaskSlot();
		slot.sideEffect(async signal => {
			events.push(0);
			await Promise.resolve();
			events.push(1, signal.aborted);
		});
		slot.sideEffect(() => events.push(2));
		slot.sideEffect(() => events.push(3));
		slot.sideEffect(signal => events.push(4, signal.aborted));
		await Promise.resolve();
		assertEvents(events, [0, 1, true]);
		await Promise.resolve();
		assertEvents(events, [4, false]);
		slot.sideEffect(() => events.push(5));
		await Promise.resolve();
		assertEvents(events, [5]);
	});

	await ctx.test("abort side effects by blocking tasks", async () => {
		const events: unknown[] = [];
		const slot = new TaskSlot();
		slot.sideEffect(async signal => {
			events.push(0);
			await Promise.resolve();
			events.push(1, signal.aborted);
		});
		events.push(2);
		const result = slot.block(async () => {
			events.push(3);
			return 42;
		});
		events.push(4);
		slot.sideEffect(() => {
			events.push(5);
		});
		await result;
		assertEvents(events, [0, 2, 4, 1, true, 3]);
		await Promise.resolve();
		assertEvents(events, []);
	});

	await ctx.test("multiple blocking tasks", async () => {
		const events: unknown[] = [];
		const slot = new TaskSlot();
		slot.sideEffect(async signal => {
			events.push(0);
			await Promise.resolve();
			events.push(1, signal.aborted);
		});
		const a = slot.block(() => {
			events.push("a");
			return "a";
		});
		const b = slot.block(() => {
			events.push("b");
			return "b";
		});
		assertEvents(events, [0]);
		strictEqual(await a, "a");
		strictEqual(await b, "b");
		assertEvents(events, [1, true, "a", "b"]);
	});
});
