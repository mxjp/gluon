import { Bench, Group, offscreen } from "./common";

export const renderingGroup = new Group("Rendering", [
	new Group("Create Element", [
		new Bench("cloneNode (vanilla js)", () => {
			const template = document.createElement("template");
			template.innerHTML = `<input type="text" class="foo bar baz" style="color: red; width: 42px;" placeholder="Hello World!" value="Some text...">`;
			return offscreen({
				sampleSize: 10_000,
				cycle() {
					const elem = template.content.childNodes[0].cloneNode(true);
					elem.addEventListener("click", () => {});
					return elem;
				},
			});
		}),

		new Bench("document.createElement (vanilla js)", () => {
			return offscreen({
				sampleSize: 10_000,
				cycle() {
					const elem = document.createElement("input");
					elem.type = "text";
					elem.classList.add("foo", "bar", "baz");
					elem.style.color = "red";
					elem.style.width = "42px";
					elem.placeholder = "Hello World!";
					elem.value = "Some text...";
					elem.addEventListener("click", () => {});
					return elem;
				},
			});
		}),

		new Bench("gluon jsx", () => {
			return offscreen({
				sampleSize: 10_000,
				cycle() {
					return <input
						type="text"
						class="foo bar baz"
						style={{
							color: "red",
							width: "42px",
						}}
						placeholder="Hello World!"
						value="Some text..."
						$click={() => {}}
					/>;
				},
			});
		}),

		new Bench("undefined attributes", () => {
			return offscreen({
				sampleSize: 10_000,
				cycle() {
					return <div
						a={undefined}
						b={undefined}
						c={undefined}
						d={undefined}
						e={undefined}
						f={undefined}
						g={undefined}
						h={undefined}
						i={undefined}
						j={undefined}
						style={undefined}
						class={undefined}
					/>;
				},
			});
		}),
	]),
]);
