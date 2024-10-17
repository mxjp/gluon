# Portalling
In addition to being the entry point of your application, the `mount` function allows you to render content into a different part of the DOM. This is commonly known as "portalling" in other frameworks.

=== "JSX"
	```jsx
	import { mount, capture } from "rvx";

	// Mount some content and capture it's lifecycle:
	const unmount = capture(() => {
		mount(document.body, <>Hello World!</>);
	});

	// Unmount:
	unmount();
	```

=== "No Build"
	```jsx
	import { mount, capture } from "./rvx.js";

	// Mount some content and capture it's lifecycle:
	const unmount = capture(() => {
		mount(document.body, "Hello World!");
	});

	// Unmount:
	unmount();
	```

This can be used to implement things like popovers, dialogs or any other kind of floating content:

=== "JSX"
	```jsx
	import { mount, watch, sig } from "rvx";

	function ExamplePopover() {
		const visible = sig(false);

		// Watch automatically takes care of the lifecycle:
		watch(visible, visible => {
			if (visible) {
				mount(document.body, <div>Hello World!</div>);
			}
		});

		return <button on:click={() => { visible.value = !visible.value }}>
			Toggle Popover
		</button>;
	}
	```

=== "No Build"
	```jsx
	import { mount, watch, sig, e } from "./rvx.js";

	function ExamplePopover() {
		const visible = sig(false);

		// Watch automatically takes care of the lifecycle:
		watch(visible, visible => {
			if (visible) {
				mount(document.body, e("div").append("Hello World!"));
			}
		});

		return e("button").on("click", () => { visible.value = !visible.value }).append(
			"Toggle Popover",
		);
	}
	```
