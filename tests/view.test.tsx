import "./env.js";

import test from "node:test";
import { notStrictEqual, strictEqual, throws } from "node:assert";

import { View, capture } from "@mxjp/gluon";
import { assertEvents, boundaryEvents, testView, text } from "./common.js";

await test("view", async ctx => {

	await ctx.test("init incomplete", () => {
		throws(() => new View(() => {}));
		throws(() => new View(setBoundary => {
			setBoundary(document.createTextNode("test"), undefined);
		}));
		throws(() => new View(setBoundary => {
			setBoundary(undefined, document.createTextNode("test"));
		}));
	});

	await ctx.test("init single node", () => {
		const view = new View(setBoundary => {
			const node = <div>test</div>;
			setBoundary(node, node);
		});

		strictEqual(view.parent, undefined);
		strictEqual(view.first, view.last);
		strictEqual(text(view.first), "test");
	});

	await ctx.test("init different nodes", () => {
		const { view } = testView();
		strictEqual(view.parent instanceof DocumentFragment, true);
		strictEqual(text(view.first), "f");
		strictEqual(text(view.last), "l");
	});

	await ctx.test("boundary owner", () => {
		const events: unknown[] = [];
		const view = testView();

		const unset = capture(() => {
			view.view.setBoundaryOwner(boundaryEvents(events));
		});
		assertEvents(events, []);

		const a = view.nextFirst();
		strictEqual(view.view.first, a);
		assertEvents(events, ["f0l"]);

		const b = view.nextLast();
		strictEqual(view.view.last, b);
		assertEvents(events, ["f0l1"]);

		throws(() => view.view.setBoundaryOwner(() => {}));
		unset();
		view.view.setBoundaryOwner(() => {});

		const c = view.nextFirst();
		strictEqual(view.view.first, c);
		const d = view.nextLast();
		strictEqual(view.view.last, d);
		assertEvents(events, []);
	});

	await ctx.test("take single node", () => {
		let node!: Node;
		let parent!: Node;
		const view = new View(setBoundary => {
			node = <div>test</div>;
			parent = <div>{node}</div>;
			setBoundary(node, node);
		});
		strictEqual(node.parentNode, parent);
		strictEqual(node, view.take());
		strictEqual(node.parentNode, parent);
	});

	await ctx.test("detach single node", () => {
		let node!: Node;
		let parent!: Node;
		const view = new View(setBoundary => {
			node = <div>test</div>;
			parent = <div>{node}</div>;
			setBoundary(node, node);
		});
		strictEqual(node.parentNode, parent);
		view.detach();
		strictEqual(node.parentNode, null);
	});

	await ctx.test("take multiple nodes", () => {
		const { view } = testView();
		const frag = view.take();
		strictEqual(frag instanceof DocumentFragment, true);
		strictEqual(view.first, frag.firstChild);
		strictEqual(view.last, frag.lastChild);
	});

	await ctx.test("detach multiple nodes", () => {
		const { view } = testView();
		const parent = view.parent;
		view.detach();
		strictEqual(view.first.parentNode instanceof DocumentFragment, true);
		strictEqual(view.first.parentNode, view.last.parentNode);
		notStrictEqual(view.first.parentNode, parent);
	});

});
