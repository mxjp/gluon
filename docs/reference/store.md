# Store
The store API provides a way to create deep reactive wrappers for arbitrary objects.

The `wrap` function creates a deep reactive wrapper:
```jsx
import { wrap } from "@mxjp/gluon/store";

const state = wrap({
	message: "Hello World!",
});

<h1>{() => state.message}</h1>
```

By default, `Arrays`, `Maps`, `Sets` and `Objects` without any or with the `Object` constructor are reactive. Anything else is returned as is.

## Updates
To update a reactive object, you can directly modify the wrapper.
```jsx
const todos = wrap([
	{ name: "Foo", done: false },
	{ name: "Bar", done: false },
]);

todos[1].done = true;
todos.push({ name: "Baz", done: true });
```
Note, that every individual update is processed immediately. To prevent this, you can use [batches](./signals.md#batch):
```jsx
import { batch } from "@mxjp/gluon";

batch(() => {
	todos[1].done = true;
	todos.push({ name: "Baz", done: true });
});
```

## Classes
By default, arbitrary class instances are not reactive unless you specify, how to wrap them:
```jsx
import { wrapInstancesOf } from "@mxjp/gluon";

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
```jsx
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
