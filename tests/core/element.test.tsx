import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import { createElement, e, extract, inject, Show, sig, StyleMap, uncapture } from "@mxjp/gluon";

import { assertEvents } from "../common.js";

await test("element", async ctx => {
	await ctx.test("jsx & behavior", async ctx => {
		await ctx.test("element content", () => {
			strictEqual((<div /> as HTMLElement).outerHTML, "<div></div>");
			strictEqual((<div></div> as HTMLElement).outerHTML, "<div></div>");
			strictEqual((<div>test</div> as HTMLElement).outerHTML, "<div>test</div>");
			strictEqual((<div>1{2}</div> as HTMLElement).outerHTML, "<div>12</div>");
		});

		await ctx.test("events", () => {
			const events: any[] = [];
			const elem = inject("foo", "bar", () => {
				return <div
					on:click={event => {
						strictEqual(extract("foo"), "bar");
						// Don't remove, only for testing the type:
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						const _: MouseEvent = event;
						events.push(event);
					}}
					on:custom-event={(event: CustomEvent) => {
						strictEqual(extract("foo"), "bar");
						events.push(event);
					}}
				/> as HTMLElement;
			});
			const a = new MouseEvent("click");
			elem.dispatchEvent(a);
			const b = new CustomEvent("custom-event");
			elem.dispatchEvent(b);
			deepStrictEqual(events, [a, b]);
		});

		await ctx.test("capture events", () => {
			const events: any[] = [];
			const elem = inject("foo", "bar", () => {
				return <div
					on:click={[event => {
						strictEqual(extract("foo"), "bar");
						// Don't remove, only for testing the type:
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						const _: MouseEvent = event;
						events.push(event);
					}, { capture: true }]}
					on:custom-event={[(event: CustomEvent) => {
						strictEqual(extract("foo"), "bar");
						events.push(event);
					}, { capture: true }]}
				/> as HTMLElement;
			});
			const a = new MouseEvent("click");
			elem.dispatchEvent(a);
			const b = new CustomEvent("custom-event");
			elem.dispatchEvent(b);
			deepStrictEqual(events, [a, b]);
		});

		await ctx.test("attributes", () => {
			const elem = uncapture(() => <div
				foo="bar"
				class="a b"
				data-bar="baz"
				attr:data-baz="boo"
				prop:title="example"
			/>) as HTMLElement;
			strictEqual(elem.getAttribute("foo"), "bar");
			deepStrictEqual(Array.from(elem.classList), ["a", "b"]);
			strictEqual(elem.dataset.bar, "baz");
			strictEqual(elem.dataset.baz, "boo");
			strictEqual(elem.title, "example");
		});

		await ctx.test("removed attribute", () => {
			const signal = sig<any>(false);
			const elem = uncapture(() => <div test-attr={signal} />) as HTMLElement;
			strictEqual(elem.getAttribute("test-attr"), null);

			signal.value = true;
			strictEqual(elem.getAttribute("test-attr"), "");

			signal.value = 42;
			strictEqual(elem.getAttribute("test-attr"), "42");

			signal.value = null;
			strictEqual(elem.getAttribute("test-attr"), null);

			signal.value = "abc";
			strictEqual(elem.getAttribute("test-attr"), "abc");

			signal.value = undefined;
			strictEqual(elem.getAttribute("test-attr"), null);
		});

		await ctx.test("class attribute", () => {
			const a = sig("a");
			const d = sig(false);
			const elem = uncapture(() => <div class={() => [
				a.value,
				"b",
				undefined,
				null,
				false,
				{
					c: true,
					d,
				},
			]} />) as HTMLElement;
			deepStrictEqual(Array.from(elem.classList), ["a", "b", "c"]);
			a.value = "foo";
			deepStrictEqual(Array.from(elem.classList), ["foo", "b", "c"]);
			d.value = true;
			deepStrictEqual(Array.from(elem.classList), ["foo", "b", "c", "d"]);
		});

		await ctx.test("style attribute", () => {
			const a = sig<StyleMap>({ color: "blue" });
			const b = sig("red");
			const c = sig<StyleMap>({ width: "42px" });
			const elem = uncapture(() => <div style={[
				a,
				() => [
					[
						{ color: b },
					],
					c.value,
				],
			]} />) as HTMLElement;
			strictEqual(elem.style.color, "red");
			strictEqual(elem.style.width, "42px");
			c.value = { width: "7px" };
			strictEqual(elem.style.color, "red");
			strictEqual(elem.style.width, "7px");
			a.value = { color: "blue", width: "13px" };
			strictEqual(elem.style.color, "red");
			strictEqual(elem.style.width, "7px");
			b.value = "green";
			strictEqual(elem.style.color, "green");
			strictEqual(elem.style.width, "7px");
			c.value = {};
			strictEqual(elem.style.color, "green");
			strictEqual(elem.style.width, "7px");
			a.value = { color: "gray" };
			strictEqual(elem.style.color, "green");
			strictEqual(elem.style.width, "7px");
			b.value = "silver";
			strictEqual(elem.style.color, "silver");
			strictEqual(elem.style.width, "7px");
		});

		await ctx.test("ref attribute", () => {
			const events: unknown[] = [];
			uncapture(() => <div
				attr:data-a={() => {
					events.push("a");
				}}
				ref={elem => {
					strictEqual(elem instanceof HTMLDivElement, true);
					events.push("ref");
				}}
				attr:data-b={() => {
					events.push("b");
				}}
			>
				{() => {
					events.push("content");
				}}
			</div> as HTMLDivElement);
			assertEvents(events, ["a", "ref", "b", "content"]);
		});

		await ctx.test("ref native attr", () => {
			const elem = <div attr:ref="42" /> as HTMLDivElement;
			strictEqual(elem.getAttribute("ref"), "42");
		});

		await ctx.test("ref native prop", () => {
			const elem = <div prop:ref="42" /> as HTMLDivElement;
			strictEqual((elem as any).ref, "42");
		});

		await ctx.test("api types", () => {
			const elem = <div /> as HTMLElement;
			strictEqual(elem instanceof HTMLDivElement, true);
			elem.classList.add("foo");
			elem.click();
		});

		await ctx.test("fragment", () => {
			strictEqual(<></>, undefined);
			strictEqual(<>test</>, "test");
			deepStrictEqual(<>{1}{2}</>, [1, 2]);
		});

		await ctx.test("nesting", () => {
			const elem = <div>
				<input type="text" />
				{null}
				<>
					foo
					{[[<span>bar{42}</span>]]}
				</>
			</div> as HTMLElement;

			strictEqual(elem.outerHTML, [
				`<div>`,
				`<input type="text">`,
				`foo`,
				`<span>bar42</span>`,
				`</div>`,
			].join(""));
		});
	});

	await ctx.test("createElement", () => {
		strictEqual(createElement("div", {}, undefined).outerHTML, `<div></div>`);
		strictEqual(createElement("div", { title: "a" }, undefined).outerHTML, `<div title="a"></div>`);
		strictEqual(createElement("div", {}, "b").outerHTML, `<div>b</div>`);
		strictEqual(createElement("div", { title: "a" }, "b").outerHTML, `<div title="a">b</div>`);
	});

	await ctx.test("e", () => {
		uncapture(() => {
			strictEqual(e("div").outerHTML, `<div></div>`);
			strictEqual(e("div", []).outerHTML, `<div></div>`);
			strictEqual(e("div", {}, []).outerHTML, `<div></div>`);

			strictEqual(e("div", "a").outerHTML, `<div>a</div>`);
			strictEqual(e("div", ["a"]).outerHTML, `<div>a</div>`);

			strictEqual(e("div", () => "a").outerHTML, `<div>a</div>`);
			strictEqual(e("div", [() => "a"]).outerHTML, `<div>a</div>`);

			strictEqual(e("div", sig("a")).outerHTML, `<div>a</div>`);
			strictEqual(e("div", [sig("a")]).outerHTML, `<div>a</div>`);

			strictEqual(e("div", Show({ when: true, children: () => "a" })).outerHTML, `<div>a</div>`);
			strictEqual(e("div", [Show({ when: true, children: () => "a" })]).outerHTML, `<div>a</div>`);

			strictEqual(e("div", {}, "a").outerHTML, `<div>a</div>`);
			strictEqual(e("div", { title: "b" }, "a").outerHTML, `<div title="b">a</div>`);
		});
	});
});
