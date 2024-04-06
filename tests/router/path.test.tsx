import "../env.js";

import { strictEqual } from "node:assert";
import test from "node:test";

import { join, normalize, trimBase } from "@mxjp/gluon/router";

await test("router/path", async ctx => {
	await ctx.test("normalize", () => {
		strictEqual(normalize(""), "");
		strictEqual(normalize("/"), "");
		strictEqual(normalize("/", false), "");

		strictEqual(normalize("foo"), "/foo");
		strictEqual(normalize("/foo"), "/foo");

		strictEqual(normalize("foo/"), "/foo/");
		strictEqual(normalize("foo/", false), "/foo");
		strictEqual(normalize("/foo/"), "/foo/");
		strictEqual(normalize("/foo/", false), "/foo");
	});

	await ctx.test("join", () => {
		strictEqual(join("", ""), "");
		strictEqual(join("", "/"), "");
		strictEqual(join("", "/", false), "");
		strictEqual(join("/", ""), "");
		strictEqual(join("/", "/"), "");
		strictEqual(join("/", "/", false), "");

		strictEqual(join("foo", ""), "/foo");
		strictEqual(join("/foo", ""), "/foo");
		strictEqual(join("", "foo"), "/foo");
		strictEqual(join("", "/foo"), "/foo");
		strictEqual(join("foo/", ""), "/foo");
		strictEqual(join("foo/", "", false), "/foo");
		strictEqual(join("/foo/", ""), "/foo");
		strictEqual(join("/foo/", "", false), "/foo");

		strictEqual(join("", "foo/"), "/foo/");
		strictEqual(join("", "foo/", false), "/foo");
		strictEqual(join("", "/foo/"), "/foo/");
		strictEqual(join("", "/foo/", false), "/foo");

		strictEqual(join("foo", "bar"), "/foo/bar");
		strictEqual(join("foo", "/bar"), "/foo/bar");
		strictEqual(join("foo/", "bar"), "/foo/bar");
		strictEqual(join("/foo", "bar"), "/foo/bar");
		strictEqual(join("/foo", "/bar"), "/foo/bar");
		strictEqual(join("/foo/", "/bar"), "/foo/bar");

		strictEqual(join("foo", "bar/"), "/foo/bar/");
		strictEqual(join("foo", "bar/", false), "/foo/bar");
		strictEqual(join("foo", "/bar/"), "/foo/bar/");
		strictEqual(join("foo/", "bar/"), "/foo/bar/");
		strictEqual(join("/foo", "bar/"), "/foo/bar/");
		strictEqual(join("/foo", "/bar/"), "/foo/bar/");
		strictEqual(join("/foo/", "/bar/"), "/foo/bar/");
	});

	await ctx.test("trimBase", () => {
		strictEqual(trimBase("", ""), "");
		strictEqual(trimBase("", "/"), "");
		strictEqual(trimBase("/", ""), "");

		strictEqual(trimBase("/", "foo"), "/foo");
		strictEqual(trimBase("", "foo/bar"), "/foo/bar");

		strictEqual(trimBase("foo", "foo/bar"), "/bar");
		strictEqual(trimBase("foo", "/foo/bar"), "/bar");
		strictEqual(trimBase("/foo", "foo/bar"), "/bar");
		strictEqual(trimBase("foo", "foo/bar/"), "/bar/");
		strictEqual(trimBase("foo/", "foo/bar"), "/bar");
		strictEqual(trimBase("foo/bar", "foo/bar/baz/boo"), "/baz/boo");

		strictEqual(trimBase("foo", "bar"), undefined);
		strictEqual(trimBase("foo/", "bar"), undefined);
		strictEqual(trimBase("foo", "foobar"), undefined);
		strictEqual(trimBase("foo/", "foobar"), undefined);
	});
});
