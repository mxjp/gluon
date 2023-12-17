import { strictEqual } from "node:assert";
import test from "node:test";

import { join, normalize } from "@mxjp/gluon";

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

});
