import "./env.js";

import test from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";

await test("jsx-runtime", async ctx => {

	await ctx.test("element content", () => {
		strictEqual((<div />).outerHTML, "<div></div>");
		strictEqual((<div></div>).outerHTML, "<div></div>");
		strictEqual((<div>test</div>).outerHTML, "<div>test</div>");
		strictEqual((<div>1{2}</div>).outerHTML, "<div>12</div>");
	});

	await ctx.test("events", () => {
		const events: any[] = [];
		const elem = <div
			$click={event => {
				// Don't remove, only for testing the type:
				const _: MouseEvent = event;

				events.push(event);
			}}
			$custom-event={(event: CustomEvent) => {
				events.push(event);
			}}
		/>;
		const a = new MouseEvent("click");
		elem.dispatchEvent(a);
		const b = new CustomEvent("custom-event");
		elem.dispatchEvent(b);
		deepStrictEqual(events, [a, b]);
	});

	await ctx.test("capture events", () => {
		const events: any[] = [];
		const elem = <div
			$$click={event => {
				// Don't remove, only for testing the type:
				const _: MouseEvent = event;

				events.push(event);
			}}
			$$custom-event={(event: CustomEvent) => {
				events.push(event);
			}}
		/>;
		const a = new MouseEvent("click");
		elem.dispatchEvent(a);
		const b = new CustomEvent("custom-event");
		elem.dispatchEvent(b);
		deepStrictEqual(events, [a, b]);
	});

	await ctx.test("attributes", () => {
		const elem = <div
			foo="bar"
			class="a b"
			data-bar="baz"
			title="example"
		/>;
		strictEqual(elem.getAttribute("foo"), "bar");
		deepStrictEqual(Array.from(elem.classList), ["a", "b"]);
		strictEqual(elem.dataset.bar, "baz");
		strictEqual(elem.title, "example");
	});

	await ctx.test("api types", () => {
		const elem = <div />;
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
		</div>;

		strictEqual(elem.outerHTML, [
			`<div>`,
				`<input type="text">`,
				`foo`,
				`<span>bar42</span>`,
			`</div>`,
		].join(""));
	});

});
