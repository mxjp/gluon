import test from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";

import { Route, matchRoute } from "@mxjp/gluon/router";

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

});
