# Lifecycle
Teardown hooks are the only lifecycle hook in gluon. They can be used to run logic when the lifecycle context they have been registered in is disposed.

## `teardown`
Register a hook to be called when the current lifecycle is disposed:

=== "JSX"
	```jsx
	import { teardown } from "@mxjp/gluon";

	const handle = setInterval(() => console.log("ping"), 1000);

	teardown(() => {
		clearInterval(handle);
	});
	```

=== "No Build"
	```jsx
	import { teardown } from "./gluon.js";

	const handle = setInterval(() => console.log("ping"), 1000);

	teardown(() => {
		clearInterval(handle);
	});
	```

Calling `teardown` outside of any functions listed below has no effect and "leaks" the teardown hook. When running tests, this behavior can be [configured](./testing.md#leak-detection) to log leaks or to throw an error.

## `capture`
Capture teardown hooks during a function call:

=== "JSX"
	```jsx
	import { capture, teardown } from "@mxjp/gluon";

	const dispose = capture(() => {
		teardown(() => { ... });
	});

	dispose();
	```

=== "No Build"
	```jsx
	import { capture, teardown } from "./gluon.js";

	const dispose = capture(() => {
		teardown(() => { ... });
	});

	dispose();
	```

Teardown hooks are called in reverse registration order when the returned `dispose` function is called.

If the specified function throws an error, teardown hooks are called in reverse registration order and the error is re-thrown.

## `captureSelf`
This is almost the same as `capture` and is meant for things that need to dispose themselves.

=== "JSX"
	```jsx
	import { captureSelf, teardown } from "@mxjp/gluon";

	captureSelf(dispose => {
		teardown(() => { ... });

		dispose();
	});
	```

=== "No Build"
	```jsx
	import { captureSelf, teardown } from "./gluon.js";

	captureSelf(dispose => {
		teardown(() => { ... });

		dispose();
	});
	```

Teardown hooks are called in reverse registration order when the `dispose` function is called.

When `dispose` is called while the callback is still running, it has no effect and will call teardown hooks immediately after the callback completes instead.

If the specified function throws an error, teardown hooks are called in reverse registration order and the error is re-thrown.

## `uncapture`
To explicitly leak teardown hooks, the `uncapture` function can be used. Code running during the call has an infinitly long lifecycle.

=== "JSX"
	```jsx
	import { uncapture } from "@mxjp/gluon";

	uncapture(() => {
		// This has no effect here:
		teardown(() => { ... });
	});
	```

=== "No Build"
	```jsx
	import { uncapture } from "./gluon.js";

	uncapture(() => {
		// This has no effect here:
		teardown(() => { ... });
	});
	```

## `nocapture`
There are some places where registering teardown hooks is very likely a mistake. E.g. inside of [expressions](signals.md#expressions). Trying to register teardown hooks during an `nocapture` call will throw an error:

=== "JSX"
	```jsx
	import { nocapture } from "@mxjp/gluon";

	nocapture(() => {
		// This will throw an error:
		teardown(() => { ... });
	});
	```

=== "No Build"
	```jsx
	import { nocapture } from "./gluon.js";

	nocapture(() => {
		// This will throw an error:
		teardown(() => { ... });
	});
	```

## `isolate`
Run a function within an error isolation boundary.

+ If an error is thrown, teardown hooks are immediately called in reverse registration order and the error is re-thrown.
+ If no error is thrown, this behaves as if teardown hooks were registered in the outer context.

=== "JSX"
	```jsx
	import { isolate } from "@mxjp/gluon";

	isolate(() => {
		teardown(() => doSomeCleanup());
		throw new Error("something went wrong");
	});
	```

=== "No Build"
	```jsx
	import { isolate } from "./gluon.js";

	isolate(() => {
		teardown(() => doSomeCleanup());
		throw new Error("something went wrong");
	});
	```

## Nesting
Calls to `capture`, `captureSelf`, `uncapture`, `nocapture` and `isolate` can be arbitrarily nested:

=== "JSX"
	```jsx
	import { capture, captureSelf, uncapture, nocapture } from "@mxjp/gluon";

	nocapture(() => {
		const dispose = capture(() => {
			// This works:
			teardown(() => { ... });
			uncapture(() => {
				// This is ignored:
				teardown(() => { ... });
			});
		});

		dispose();

		// This will fail:
		teardown({ ... });
	});
	```

=== "No Build"
	```jsx
	import { capture, captureSelf, uncapture, nocapture } from "./gluon.js";

	nocapture(() => {
		const dispose = capture(() => {
			// This works:
			teardown(() => { ... });
			uncapture(() => {
				// This is ignored:
				teardown(() => { ... });
			});
		});

		dispose();

		// This will fail:
		teardown({ ... });
	});
	```

## Repetitive Disposal
By default, lifecycle hooks can be called multiple times and primitives like [`capture`](#capture) and [`captureSelf`](#captureself) don't provide any logic for preventing multiple calls.

```jsx
const dispose = capture(() => {
	teardown(() => {
		console.log("teardown");
	});
});

// This will call all registered hooks twice:
dispose();
dispose();
```

In general, teardown hooks should never cause any unintended behavior just because they are called multiple times. Preventing something from being called multiple times must be implemented manually.

## Async Code
Capturing teardown hooks relies on the synchronous call stack and therefore only works partially with async code:
```jsx
const dispose = capture(async () => {
	// This will be captured:
	teardown(() => { ... });

	await something;

	// This will be leaked:
	teardown(() => { ... });
});
```

In a test or development environment, you can configure [how leaked teardown hooks behave](./testing.md#leak-detection).

To dispose things that are initialized later, you manually need to capture it's teardown hooks:
```jsx
const dispose = capture(async () => {
	let disposed = false;
	let disposeLater: TeardownHook | undefined;

	teardown(() => {
		disposed = true;
		disposeLater?.();
	});

	await something;

	if (!disposed) {
		disposeLater = capture(() => {
			// Register some teardown hooks here...
		});
	}
});
```
