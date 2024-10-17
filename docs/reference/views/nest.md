# `<Nest>`
Render a [component](../components.md) returned from an expression.

=== "JSX"
	```jsx
	import { Nest, sig } from "@mxjp/gluon";

	const message = sig({ type: "heading", value: "Hello World!" });

	<Nest>
		{() => {
			const current = message.value;
			switch (current.type) {
				case "heading": return () => <h1>{current.value}</h1>;
				default: return () => <>Unknown message type.</>;
			}
		}}
	</Nest>
	```

=== "No Build"
	```jsx
	import { Nest, sig, e } from "./gluon.js";

	const message = sig({ type: "heading", value: "Hello World!" });

	Nest({
		children: () => {
			const current = message.value;
			switch (current.type) {
				case "heading": return () => e("h1").append(current.value);
				default: return () => "Unknown message type.";
			}
		},
	})
	```

Returning `null` or `undefined` results in rendering nothing.
