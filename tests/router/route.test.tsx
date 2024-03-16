import "../env.js";

import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import { extract, Inject, sig, uncapture, watch } from "@mxjp/gluon";
import { ChildRouter, matchRoute, Route, ROUTER, Routes, watchRoutes } from "@mxjp/gluon/router";

import { assertEvents, lifecycleEvent, text } from "../common.js";
import { TestRouter } from "./common.js";

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

	await ctx.test("routes", async ctx => {
		await ctx.test("matching", () => {
			const router = new TestRouter();
			const root = uncapture(() => <div>
				<Inject key={ROUTER} value={router}>
					{() => <Routes routes={[
						{ path: "/", content: () => <>a</> },
						{ path: "/b", content: () => <>b</> },
						{ path: "/b/", content: () => <>c</> },
						{ path: /^\/d-(\d+)(\/|$)/, content: props => {
							return <>d:{(props.params as RegExpExecArray)[1]}</>;
						} },
					]} />}
				</Inject>
			</div>) as HTMLDivElement;
			strictEqual(text(root), "a");
			for (const [path, expectedText] of [
				["/b", "b"],
				["/b/c", "c"],
				["/d-123", "d:123"],
				["/d-456/test", "d:456"],
				["/e", ""],
			] as [string, string][]) {
				router.push(path);
				strictEqual(text(root), expectedText);
			}
		});

		await ctx.test("lifecycle & child router", () => {
			const events: unknown[] = [];
			const router = new TestRouter();
			uncapture(() => <div>
				<Inject key={ROUTER} value={router}>
					{() => <Routes routes={[
						{ path: "/", content: () => lifecycleEvent(events, "a") },
						{ path: "/b", content: () => lifecycleEvent(events, "b") },
						{ path: "/c/", content: () => {
							lifecycleEvent(events, "c");
							const child = extract(ROUTER);
							strictEqual(child instanceof ChildRouter, true);
							watch(() => child!.path, path => events.push(path));
						} },
					]} />}
				</Inject>
			</div>) as HTMLDivElement;
			assertEvents(events, ["s:a"]);
			router.push("/b");
			assertEvents(events, ["e:a", "s:b"]);
			router.push("/c");
			assertEvents(events, ["e:b", "s:c", ""]);
			router.push("/c/");
			assertEvents(events, []);
			router.push("/c/foo");
			assertEvents(events, ["/foo"]);
			router.push("/c/bar/baz");
			assertEvents(events, ["/bar/baz"]);
			router.push("/d");
			assertEvents(events, ["e:c"]);
			router.push("/d/e");
			assertEvents(events, []);
		});
	});
});
