import { strictEqual } from "node:assert";
import test from "node:test";

import { uncapture, watch } from "rvx";
import { MemoryRouter } from "rvx/router";

import { assertEvents } from "../common.js";

await test("router/memory router", async ctx => {
	await ctx.test("general usage", () => {
		const events: unknown[] = [];
		const router = uncapture(() => new MemoryRouter());
		strictEqual(router.root, router);
		strictEqual(router.parent, undefined);

		uncapture(() => {
			watch(() => [router.path, router.query] as const, ([path, query]) => {
				events.push([path, query?.toString()]);
			});
		});

		assertEvents(events, [["", undefined]]);

		router.push("/a");
		assertEvents(events, [["/a", undefined]]);

		router.push("/b", "test=1");
		assertEvents(events, [["/b", "test=1"]]);

		router.replace("/c");
		assertEvents(events, [["/c", undefined]]);

		router.push("/d", { test: "2" });
		assertEvents(events, [["/d", "test=2"]]);
	});

	await ctx.test("initial state", () => {
		const router = uncapture(() => new MemoryRouter({
			path: "/foo/bar/",
			query: {
				foo: "1",
				bar: "2",
			},
		}));

		strictEqual(router.path, "/foo/bar/");
		strictEqual(router.query?.toString(), "foo=1&bar=2");
	});
});
