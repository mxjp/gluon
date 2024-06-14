# Lifecycle
Teardown hooks are the only lifecycle hook in gluon. They can be used to run logic when the lifecycle context they have been registered in is disposed.

## `teardown`
Register a hook to be called when the current lifecycle is disposed:
```jsx
import { teardown } from "@mxjp/gluon";

const handle = setInterval(() => console.log("ping"), 1000);

teardown(() => {
	clearInterval(handle);
});
```
Calling `teardown` outside of any functions listed below has no effect and "leaks" the teardown hook. When running tests, this behavior can be [configured](../testing.md#leak-detection) to log leaks or to throw an error.

## `capture`
Capture teardown hooks during a function call:
```jsx
import { capture, teardown } from "@mxjp/gluon";

const dispose = capture(() => {
	teardown(() => { ... });
});

dispose();
```
Teardown hooks are called in registration order when the returned `dispose` function is called.

## `captureSelf`
This is almost the same as `capture` and is meant for things that need to dispose themselves.
```jsx
import { captureSelf, teardown } from "@mxjp/gluon";

captureSelf(dispose => {
	teardown(() => { ... });

	dispose();
});
```
Teardown hooks are called in registration order when the `dispose` function is called.

When `dispose` is called while the callback is still running, it has no effect and will call teardown hooks immediately after the callback completes instead.

## `uncapture`
To explicitly leak teardown hooks, the `uncapture` function can be used. Code running during the call has an infinitly long lifecycle.
```jsx
import { uncapture } from "@mxjp/gluon";

uncapture(() => {
	// This has no effect here:
	teardown(() => { ... });
});
```

## `nocapture`
There are some places where registering teardown hooks is very likely a mistake. E.g. inside of [expressions](signals.md#expressions). Trying to register teardown hooks during an `nocapture` call will throw an error:
```jsx
import { nocapture } from "@mxjp/gluon";

nocapture(() => {
	// This will throw an error:
	teardown(() => { ... });
});
```

## Nesting
Calls to `capture`, `captureSelf`, `uncapture` and `nocapture` can be arbitrarily nested:
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

## Error Handling
The lifecycle system has **no** special error handling.

+ Throwing errors from within `capture` or `captureSelf` will prevent any teardown hooks from running.
+ Throwing errors from within a teardown hook will prevent any other teardown hooks from running.

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
