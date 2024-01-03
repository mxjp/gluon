import "../env.js";

import { strictEqual } from "node:assert";
import test from "node:test";

import { inject, Tasks, Unwrap } from "@mxjp/gluon";

import { future, text } from "../common.js";

await test("async/unwrap", async ctx => {
	await ctx.test("resolve", async () => {
		const [promise, resolve] = future<number>();
		const root = <div>
			<Unwrap source={promise} pending={() => "pending"}>
				{value => `resolved: ${value}`}
			</Unwrap>
		</div> as HTMLElement;
		strictEqual(text(root), "pending");
		resolve(42);
		await Promise.resolve();
		strictEqual(text(root), "resolved: 42");
	});

	await ctx.test("reject", async () => {
		const [promise,, reject] = future();
		const root = <div>
			<Unwrap source={promise} pending={() => "pending"} rejected={error => `rejected: ${error}`}>
				{() => "resolved"}
			</Unwrap>
		</div> as HTMLElement;
		strictEqual(text(root), "pending");
		reject(7);
		await Promise.resolve();
		strictEqual(text(root), "rejected: 7");
	});

	await ctx.test("pending task", async () => {
		const [promise, resolve] = future();
		const tasks = new Tasks();
		inject(tasks, () => <Unwrap source={promise} /> as unknown);
		strictEqual(tasks.pending, true);
		resolve();
		await Promise.resolve();
		strictEqual(tasks.pending, false);
	});

	await ctx.test("inert task", async () => {
		const [promise, resolve] = future();
		const tasks = new Tasks();
		inject(tasks, () => <Unwrap source={promise} inert /> as unknown);
		strictEqual(tasks.pending, false);
		resolve();
		await Promise.resolve();
		strictEqual(tasks.pending, false);
	});
});
