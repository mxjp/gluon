# Store
The store API provides a way to create deep reactive wrappers for arbitrary objects.

The `wrap` function creates a deep reactive wrapper:

=== "JSX"
	```jsx
	import { wrap } from "@mxjp/gluon/store";

	const state = wrap({
		message: "Hello World!",
	});

	<h1>{() => state.message}</h1>
	```

=== "No Build"
	```jsx
	import { wrap, e } from "./gluon.js";

	const state = wrap({
		message: "Hello World!",
	});

	e("h1").append(() => state.message)
	```

By default, `Arrays`, `Maps`, `Sets` and `Objects` without any or with the `Object` constructor are reactive. Anything else is returned as is.

## Updates
To update a reactive object, you can directly modify the wrapper.

=== "JSX"
	```jsx
	import { wrap } from "@mxjp/gluon/store";

	const todos = wrap([
		{ name: "Foo", done: false },
		{ name: "Bar", done: false },
	]);

	todos[1].done = true;
	todos.push({ name: "Baz", done: true });
	```

=== "No Build"
	```jsx
	import { wrap } from "./gluon.js";

	const todos = wrap([
		{ name: "Foo", done: false },
		{ name: "Bar", done: false },
	]);

	todos[1].done = true;
	todos.push({ name: "Baz", done: true });
	```

Note, that every individual update is processed immediately. To prevent this, you can use [batches](./signals.md#batch):

=== "JSX"
	```jsx
	import { batch } from "@mxjp/gluon";

	batch(() => {
		todos[1].done = true;
		todos.push({ name: "Baz", done: true });
	});
	```

=== "No Build"
	```jsx
	import { batch } from "./gluon.js";

	batch(() => {
		todos[1].done = true;
		todos.push({ name: "Baz", done: true });
	});
	```

## Signal Reflection
The `reflect` utility can be used to create a [signal](./signals.md) that reflects a reactive property of an arbitrary object.

=== "JSX"
	```jsx
	import { reflect, wrap } from "@mxjp/gluon/store";

	const item = wrap({ name: "Foo", done: false });

	const done = reflect(item, "done");
	```

=== "No Build"
	```jsx
	import { reflect, wrap } from "./gluon.js";

	const item = wrap({ name: "Foo", done: false });

	const done = reflect(item, "done");
	```

The target object doens't need to be a reactive wrapper. Any arbitrary object with reactive properties works.

## Classes
By default, arbitrary class instances are not reactive unless you specify, how to wrap them:

=== "JSX"
	```jsx
	import { wrapInstancesOf } from "@mxjp/gluon/store";

	class Example {
		static {
			// Wrap instances of "Example" in the same way, objects are wrapped:
			wrapInstancesOf(this);

			// Or implement custom behavior:
			wrapInstancesOf(this, target => {
				return new Proxy(target, ...);
			});
		}
	}
	```

=== "No Build"
	```jsx
	import { wrapInstancesOf } from "./gluon.js";

	class Example {
		static {
			// Wrap instances of "Example" in the same way, objects are wrapped:
			wrapInstancesOf(this);

			// Or implement custom behavior:
			wrapInstancesOf(this, target => {
				return new Proxy(target, ...);
			});
		}
	}
	```

### Private Fields
Private fields are not reactive. Also, you need to ensure they are accessed through the original object instead of reactive wrappers by using `unwrap`.

=== "JSX"
	```jsx
	import { wrapInstancesOf, wrap, unwrap } from "@mxjp/gluon/store";

	class Example {
		static {
			wrapInstancesOf(this);
		}

		#count = 0;

		thisWorks() {
			// "unwrap" always returns the original object
			// or the value itself if it isn't a wrapper:
			unwrap(this).#count++;
		}

		thisFails() {
			// This will fail, since "this" refers to the
			// reactive wrapper instead of the original object:
			this.#count++;
		}
	}

	const example = wrap(new Example());
	example.thisWorks();
	example.thisFails();
	```

=== "No Build"
	```jsx
	import { wrapInstancesOf, wrap, unwrap } from "./gluon.js";

	class Example {
		static {
			wrapInstancesOf(this);
		}

		#count = 0;

		thisWorks() {
			// "unwrap" always returns the original object
			// or the value itself if it isn't a wrapper:
			unwrap(this).#count++;
		}

		thisFails() {
			// This will fail, since "this" refers to the
			// reactive wrapper instead of the original object:
			this.#count++;
		}
	}

	const example = wrap(new Example());
	example.thisWorks();
	example.thisFails();
	```
