import { strictEqual } from "node:assert";
import test from "node:test";

import { join, normalize } from "@mxjp/gluon/router";

await test("router/path", async ctx => {

	await ctx.test("normalize", () => {
		strictEqual(normalize(""), "");
		strictEqual(normalize("/"), "");

		strictEqual(normalize("foo"), "/foo");
		strictEqual(normalize("/foo"), "/foo");

		strictEqual(normalize("foo/"), "/foo/");
		strictEqual(normalize("/foo/"), "/foo/");
	});

	await ctx.test("join", () => {
		strictEqual(join("", ""), "");
		strictEqual(join("", "/"), "");
		strictEqual(join("/", ""), "");
		strictEqual(join("/", "/"), "");

		strictEqual(join("foo", ""), "/foo");
		strictEqual(join("/foo", ""), "/foo");
		strictEqual(join("", "foo"), "/foo");
		strictEqual(join("", "/foo"), "/foo");
		strictEqual(join("foo/", ""), "/foo");
		strictEqual(join("/foo/", ""), "/foo");

		strictEqual(join("", "foo/"), "/foo/");
		strictEqual(join("", "/foo/"), "/foo/");

		strictEqual(join("foo", "bar"), "/foo/bar");
		strictEqual(join("foo", "/bar"), "/foo/bar");
		strictEqual(join("foo/", "bar"), "/foo/bar");
		strictEqual(join("/foo", "bar"), "/foo/bar");
		strictEqual(join("/foo", "/bar"), "/foo/bar");
		strictEqual(join("/foo/", "/bar"), "/foo/bar");

		strictEqual(join("foo", "bar/"), "/foo/bar/");
		strictEqual(join("foo", "/bar/"), "/foo/bar/");
		strictEqual(join("foo/", "bar/"), "/foo/bar/");
		strictEqual(join("/foo", "bar/"), "/foo/bar/");
		strictEqual(join("/foo", "/bar/"), "/foo/bar/");
		strictEqual(join("/foo/", "/bar/"), "/foo/bar/");
	});

});
