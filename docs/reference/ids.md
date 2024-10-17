# Unique IDs

## `uniqueId`
Allocate an ID that is unique in the current thread.

=== "JSX"
	```jsx
	import { uniqueId } from "@mxjp/gluon";

	const id = uniqueId();

	<>
		<label for={id}>Name</label>
		<input type="text" id={id} />
	</>;
	```

=== "No Build"
	```jsx
	import { uniqueId, e } from "./gluon.js";

	const id = uniqueId();

	[
		e("label").set("for", id).append("Name"),
		e("input").set("type", "text").set("id", id),
	]
	```

+ Returns a string in the form `"gluon_{suffix}"`. E.g. `"gluon_77"`
+ There are practically infinite ids, however when the `Number.MAX_SAFE_INTEGER` suffix is reached, the current implementation switches to using `BigInts` which will slightly degrade allocation performance.

## `<UseUniqueId>`
A component for allocating a unique id using [`uniqueId`](#uniqueid).

=== "JSX"
	```jsx
	import { UseUniqueId } from "@mxjp/gluon";

	<UseUniqueId>
		{id => <>
			<label for={id}>Name</label>
			<input type="text" id={id} />
		</>}
	</UseUniqueId>
	```

=== "No Build"
	```jsx
	import { UseUniqueId, e } from "./gluon.js";

	UseUniqueId({
		children: id => [
			e("label").set("for", id).append("Name"),
			e("input").set("type", "text").set("id", id),
		],
	})
	```
