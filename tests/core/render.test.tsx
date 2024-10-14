import { deepStrictEqual, notStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import { render, sig, uncapture, View, viewNodes } from "@mxjp/gluon";

import { createText } from "../../dist/es/core/internals.js";
import { assertEvents, boundaryEvents, testView, text } from "../common.js";

await test("render", async ctx => {
	function renderToNodes(content: unknown) {
		return Array.from(viewNodes(render(content)));
	}

	await ctx.test("createText (internal)", () => {
		const signal = sig<unknown>(undefined);
		const text = uncapture(() => createText(signal));
		strictEqual(text.textContent, "");
		signal.value = null;
		strictEqual(text.textContent, "");
		signal.value = 42;
		strictEqual(text.textContent, "42");
		signal.value = "test";
		strictEqual(text.textContent, "test");
	});

	await ctx.test("view passthrough", () => {
		const inner = render(undefined);
		strictEqual(inner instanceof View, true);
		const outer = render(inner);
		strictEqual(inner, outer);
	});

	await ctx.test("null & undefined", () => {
		for (const value of [null, undefined]) {
			const view = render(value);
			const nodes = renderToNodes(view);
			strictEqual(nodes.length, 1);
			strictEqual(nodes[0] instanceof Comment, true);
		}
	});

	await ctx.test("document fragment", () => {
		const fragment = document.createDocumentFragment();
		const a = document.createElement("div");
		const b = document.createElement("div");
		fragment.appendChild(a);
		fragment.appendChild(b);
		const view = render(fragment);
		const nodes = Array.from(viewNodes(view));
		deepStrictEqual(nodes, [a, b]);
		strictEqual(a.parentNode, fragment);
		strictEqual(b.parentNode, fragment);
		const next = view.take();
		notStrictEqual(fragment, next);
		strictEqual(a.parentNode, next);
		strictEqual(b.parentNode, next);
	});

	await ctx.test("empty document fragment", () => {
		const view = render(document.createDocumentFragment());
		strictEqual(view.first instanceof Comment, true);
		strictEqual(view.first, view.last);
	});

	await ctx.test("empty document fragment in array", () => {
		const view = render([
			document.createDocumentFragment(),
			document.createDocumentFragment(),
		]);
		strictEqual(view.first instanceof Comment, true);
		strictEqual(view.first, view.last);
	});

	await ctx.test("empty document fragment in array with view", () => {
		const events: unknown[] = [];
		const inner = testView();
		const view = uncapture(() => {
			return render([
				document.createDocumentFragment(),
				inner.view,
				document.createDocumentFragment(),
			]);
		});
		strictEqual(text(view.first), "f");
		strictEqual(text(view.last), "l");
		uncapture(() => view.setBoundaryOwner(boundaryEvents(events)));
		assertEvents(events, []);

		inner.nextFirst();
		assertEvents(events, ["f0l"]);
		inner.nextLast();
		assertEvents(events, ["f0l1"]);
	});

	await ctx.test("empty document fragments in array with view", () => {
		const events: unknown[] = [];
		const inner = testView();
		const view = uncapture(() => {
			return render([
				document.createDocumentFragment(),
				document.createDocumentFragment(),
				inner.view,
				document.createDocumentFragment(),
				document.createDocumentFragment(),
			]);
		});
		strictEqual(text(view.first), "f");
		strictEqual(text(view.last), "l");
		uncapture(() => view.setBoundaryOwner(boundaryEvents(events)));
		assertEvents(events, []);

		inner.nextFirst();
		assertEvents(events, ["f0l"]);
		inner.nextLast();
		assertEvents(events, ["f0l1"]);
	});

	await ctx.test("non empty document fragments in array with view", () => {
		const events: unknown[] = [];
		const inner = testView();
		const view = uncapture(() => {
			return render([
				document.createDocumentFragment(),
				render([1, "2"]),
				document.createDocumentFragment(),
				inner.view,
				document.createDocumentFragment(),
				render([3, "4"]),
				document.createDocumentFragment(),
			]);
		});
		strictEqual(text(view.first), "1");
		strictEqual(text(view.last), "4");
		uncapture(() => view.setBoundaryOwner(boundaryEvents(events)));
		inner.nextFirst();
		inner.nextLast();
		assertEvents(events, []);
	});

	await ctx.test("node", () => {
		for (const node of [
			document.createElement("div"),
			document.createComment("test"),
		]) {
			deepStrictEqual(renderToNodes(node), [node]);
		}
	});

	await ctx.test("text", () => {
		for (const value of ["test", 42, true]) {
			for (const nodes of [
				renderToNodes(value),
				uncapture(() => renderToNodes(() => value)),
				uncapture(() => renderToNodes(sig(value))),
			]) {
				strictEqual(nodes.length, 1);
				strictEqual(nodes[0] instanceof Text, true);
				strictEqual(nodes[0].textContent, String(value));
			}
		}
	});

	await ctx.test("arrays", async ctx => {
		await ctx.test("single view", () => {
			const content = document.createElement("div");
			const inner = render(content);
			strictEqual(inner instanceof View, true);
			const outer = uncapture(() => render([inner]));
			notStrictEqual(inner, outer);
			deepStrictEqual(Array.from(viewNodes(outer)), [content]);
		});

		await ctx.test("inner view", () => {
			const inner = testView();

			const fragmentChild = document.createElement("div");
			const fragment = document.createDocumentFragment();
			fragment.appendChild(fragmentChild);

			const view = uncapture(() => render([
				"foo",
				[
					null,
					inner.view,
					() => "bar",
					fragment,
				],
				[undefined],
			]));

			uncapture(() => view.setBoundaryOwner(() => {
				throw new Error("boundary should be static");
			}));

			{
				const nodes = Array.from(viewNodes(view));
				strictEqual(nodes.length, 5);
				strictEqual(text(nodes[0]), "foo");
				strictEqual(text(nodes[1]), "f");
				strictEqual(text(nodes[2]), "l");
				strictEqual(text(nodes[3]), "bar");
				strictEqual(nodes[4], fragmentChild);
			}

			{
				inner.nextFirst();
				inner.nextLast();
				const nodes = Array.from(viewNodes(view));
				strictEqual(nodes.length, 5);
				strictEqual(text(nodes[1]), "f0");
				strictEqual(text(nodes[2]), "l1");
			}
		});

		await ctx.test("outer views", () => {
			const events: unknown[] = [];
			const first = testView();
			const last = testView();

			const fragmentChild = document.createElement("div");
			const fragment = document.createDocumentFragment();
			fragment.appendChild(fragmentChild);

			const view = uncapture(() => render([
				[first.view],
				[[
					"foo",
					fragment,
					() => 42,
				]],
				last.view,
			]));

			uncapture(() => view.setBoundaryOwner(boundaryEvents(events)));

			{
				const nodes = Array.from(viewNodes(view));
				strictEqual(nodes.length, 7);
				strictEqual(text(nodes[0]), "f");
				strictEqual(text(nodes[1]), "l");
				strictEqual(text(nodes[2]), "foo");
				strictEqual(nodes[3], fragmentChild);
				strictEqual(text(nodes[4]), "42");
				strictEqual(text(nodes[5]), "f");
				strictEqual(text(nodes[6]), "l");
				assertEvents(events, []);
			}

			{
				first.nextLast();
				strictEqual(view.first, first.view.first);
				strictEqual(view.last, last.view.last);
				const nodes = Array.from(viewNodes(view));
				strictEqual(nodes.length, 7);
				strictEqual(text(nodes[1]), "l0");
				assertEvents(events, ["fl"]);
			}

			{
				first.nextFirst();
				strictEqual(view.first, first.view.first);
				strictEqual(view.last, last.view.last);
				const nodes = Array.from(viewNodes(view));
				strictEqual(nodes.length, 7);
				strictEqual(text(nodes[0]), "f1");
				strictEqual(text(nodes[6]), "l");
				assertEvents(events, ["f1l"]);
			}

			{
				last.nextFirst();
				strictEqual(view.first, first.view.first);
				strictEqual(view.last, last.view.last);
				const nodes = Array.from(viewNodes(view));
				strictEqual(nodes.length, 7);
				strictEqual(text(nodes[5]), "f0");
				assertEvents(events, ["f1l"]);
			}

			{
				last.nextLast();
				strictEqual(view.first, first.view.first);
				strictEqual(view.last, last.view.last);
				const nodes = Array.from(viewNodes(view));
				strictEqual(nodes.length, 7);
				strictEqual(text(nodes[0]), "f1");
				strictEqual(text(nodes[6]), "l1");
				assertEvents(events, ["f1l1"]);
			}
		});
	});
});
