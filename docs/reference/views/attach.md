# `<Attach>`
Attach [content](../elements.md#content) when an [expression](../signals.md#expressions) is truthy.

=== "JSX"
	```jsx
	import { Attach } from "rvx";

	<Attach when={someCondition}>
		Hello World!
	</Attach>
	```

=== "No Build"
	```jsx
	import { Attach } from "./rvx.js";

	Attach({
		when: someCondition,
		children: "Hello World!",
	});
	```
