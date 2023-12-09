import { strictEqual } from "node:assert";
import test from "node:test";

import { joinPath, normalizePath } from "@mxjp/gluon/router";

await test("router/path", async ctx => {

	await ctx.test("normalize", () => {
		strictEqual(normalizePath(""), "");
		strictEqual(normalizePath("/"), "");

		strictEqual(normalizePath("foo"), "/foo");
		strictEqual(normalizePath("/foo"), "/foo");

		strictEqual(normalizePath("foo/"), "/foo/");
		strictEqual(normalizePath("/foo/"), "/foo/");
	});

	await ctx.test("join", () => {
		strictEqual(joinPath("", ""), "");
		strictEqual(joinPath("", "/"), "");
		strictEqual(joinPath("/", ""), "");
		strictEqual(joinPath("/", "/"), "");

		strictEqual(joinPath("foo", ""), "/foo");
		strictEqual(joinPath("/foo", ""), "/foo");
		strictEqual(joinPath("", "foo"), "/foo");
		strictEqual(joinPath("", "/foo"), "/foo");
		strictEqual(joinPath("foo/", ""), "/foo");
		strictEqual(joinPath("/foo/", ""), "/foo");

		strictEqual(joinPath("", "foo/"), "/foo/");
		strictEqual(joinPath("", "/foo/"), "/foo/");

		strictEqual(joinPath("foo", "bar"), "/foo/bar");
		strictEqual(joinPath("foo", "/bar"), "/foo/bar");
		strictEqual(joinPath("foo/", "bar"), "/foo/bar");
		strictEqual(joinPath("/foo", "bar"), "/foo/bar");
		strictEqual(joinPath("/foo", "/bar"), "/foo/bar");
		strictEqual(joinPath("/foo/", "/bar"), "/foo/bar");

		strictEqual(joinPath("foo", "bar/"), "/foo/bar/");
		strictEqual(joinPath("foo", "/bar/"), "/foo/bar/");
		strictEqual(joinPath("foo/", "bar/"), "/foo/bar/");
		strictEqual(joinPath("/foo", "bar/"), "/foo/bar/");
		strictEqual(joinPath("/foo", "/bar/"), "/foo/bar/");
		strictEqual(joinPath("/foo/", "/bar/"), "/foo/bar/");
	});

});
