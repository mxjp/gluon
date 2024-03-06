import "../env.js";

import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import { matchRoute, Route, sig, uncapture, watch, watchRoutes } from "@mxjp/gluon";

import { assertEvents } from "../common.js";

await test("router/route", async ctx => {
	await ctx.test("match", async () => {
		function assert(
			route: Route,
			path: string,
			expected?: [path: string, rest: string, params?: unknown],
		) {
			const match = matchRoute(path, [route]);
			if (expected === undefined) {
				strictEqual(match, undefined);
			} else {
				strictEqual(match?.route, route, "route");
				strictEqual(match?.path, expected[0], "path");
				strictEqual(match?.rest, expected[1], "rest");
				if (route.path instanceof RegExp) {
					deepStrictEqual(route.path.exec(path), match?.params, "regexp match");
				} else {
					strictEqual(match?.params, expected[2], "params");
				}
			}
		}

		assert({}, "", ["", ""]);
		assert({}, "/foo", ["", "/foo"]);
		assert({}, "/foo/", ["", "/foo/"]);

		assert({ path: "" }, "", ["", ""]);
		assert({ path: "" }, "/foo");
		assert({ path: "/" }, "", ["", ""]);
		assert({ path: "/" }, "/foo");

		assert({ path: "/foo" }, "");
		assert({ path: "/foo" }, "/foo", ["/foo", ""]);
		assert({ path: "/foo" }, "/foo/");
		assert({ path: "/foo" }, "/foo/bar");

		assert({ path: "/foo/" }, "");
		assert({ path: "/foo/" }, "/foo", ["/foo", ""]);
		assert({ path: "/foo/" }, "/foo/", ["/foo", ""]);
		assert({ path: "/foo/" }, "/foo/bar", ["/foo", "/bar"]);
		assert({ path: "/foo/" }, "/foo/bar/", ["/foo", "/bar/"]);

		assert({ path: () => undefined }, "/foo");
		assert({ path: () => "" }, "/foo", ["", "/foo"]);
		assert({ path: () => "foo" }, "/foo/bar", ["/foo", "/bar"]);
		assert({ path: () => "/foo" }, "/foo/bar", ["/foo", "/bar"]);
		assert({ path: () => "/baz" }, "/foo", ["/baz", "/foo"]);
		assert({ path: () => "/baz" }, "/foo/bar", ["/baz", "/foo/bar"]);
		assert({ path: () => ["", 42] }, "/foo", ["", "/foo", 42]);

		assert({ path: /foo/ }, "/foo", ["/foo", ""]);
		assert({ path: /^\/foo/ }, "/foo", ["/foo", ""]);
		assert({ path: /^\/foo/ }, "/foo/bar", ["/foo", "/bar"]);
		assert({ path: /^\/foo$/ }, "/foo", ["/foo", ""]);
		assert({ path: /^\/foo$/ }, "/foo/");
		assert({ path: /^\/foo$/ }, "/foo/bar");
		assert({ path: /^\/foo\// }, "/foo");
		assert({ path: /^\/foo\// }, "/foo/", ["/foo", ""]);
		assert({ path: /^\/foo\/$/ }, "/foo/bar");
		assert({ path: /^\/foo(?=\/bar$)/ }, "/foo");
		assert({ path: /^\/foo(?=\/bar$)/ }, "/foo/bar", ["/foo", "/bar"]);
	});

	await ctx.test("watch", () => {
		const events: unknown[] = [];
		const routes: Route[] = [
			{ path: "/" },
			{ path: /^\/foo(\/|$)/ },
		];

		const path = sig("");
		const watched = uncapture(() => watchRoutes(path, routes));
		uncapture(() => {
			watch(() => watched.match, () => events.push("match"));
			watch(() => watched.rest, () => events.push("rest"));
		});
		assertEvents(events, ["match", "rest"]);

		strictEqual(watched.match?.route, routes[0]);
		strictEqual(watched.match?.path, "");
		strictEqual(watched.match?.params, undefined);
		strictEqual(watched.rest, "");

		path.value = "/foo";
		assertEvents(events, ["match"]);
		strictEqual(watched.match?.route, routes[1]);
		strictEqual(watched.match?.path, "/foo");
		strictEqual(Array.isArray(watched.match?.params), true);
		strictEqual(watched.rest, "");

		path.value = "/foo/bar";
		assertEvents(events, ["rest"]);
		strictEqual(watched.rest, "/bar");

		path.value = "/bar";
		assertEvents(events, ["match", "rest"]);
		strictEqual(watched.match, undefined);
		strictEqual(watched.rest, "");
	});
});
