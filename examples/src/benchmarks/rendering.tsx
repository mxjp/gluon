import { e, isWritable } from "@mxjp/gluon";
import { Bench, Group, offscreenSync } from "./common";

export const renderingBenches = new Group("Rendering", [
	new Bench("Attribute Prop Test", () => {
		const elem: HTMLElement = <div />;
		return offscreenSync({
			cycle() {
				isWritable(elem, "style");
			},
		});
	}),

	new Bench("Attribute Non-Prop Test", () => {
		const elem: HTMLElement = <div />;
		return offscreenSync({
			cycle() {
				isWritable(elem, "foo-bar");
			},
		});
	}),

	new Group("Create Element", [
		new Bench("document.createElement", () => {
			return offscreenSync({
				sampleSize: 10_000,
				cooldown: 500,
				cycle() {
					const elem = document.createElement("input");
					elem.type = "text";
					elem.classList.add("foo", "bar", "baz");
					elem.style.color = "red";
					elem.style.width = "42px";
					elem.placeholder = "Hello World!";
					elem.value = "Some text...";
				},
			});
		}),

		new Bench("innerHTML", () => {
			const host: HTMLElement = <div />;
			return offscreenSync({
				sampleSize: 10_000,
				cooldown: 500,
				cycle() {
					host.innerHTML = `<input type="text" class="foo bar baz" style="color: red; width: 42px;" placeholder="Hello World!" value="Some text...">`;
				},
			});
		}),

		new Bench("gluon jsx", () => {
			return offscreenSync({
				sampleSize: 10_000,
				cooldown: 500,
				cycle() {
					(<input
						type="text"
						class="foo bar baz"
						style={{
							color: "red",
							width: "42px",
						}}
						placeholder="Hello World!"
						value="Some text..."
					/>);
				},
			});
		}),

		new Bench("gluon e", () => {
			return offscreenSync({
				sampleSize: 10_000,
				cooldown: 500,
				cycle() {
					e("input", {
						type: "text",
						class: "foo bar baz",
						style: {
							color: "red",
							width: "42px",
						},
						placeholder: "Hello World!",
						value: "Some text...",
					});
				},
			});
		}),
	]),
]);
