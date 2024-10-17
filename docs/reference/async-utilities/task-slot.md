# `TaskSlot`
This is a queue for sequentially running async tasks that can be triggered by both the user and side effects.

+ **Blocking** tasks are queued normally and are guaranteed to run.
+ **Side effects** are queued, but aborted when anything else is queued.

=== "JSX"
	```jsx
	import { TaskSlot } from "@mxjp/gluon/async";

	const slot = new TaskSlot();

	// Queue a blocking task:
	const value = await slot.block(async () => {
		// ...
		return 42;
	});

	// Queue a side effect:
	slot.sideEffect(async signal => {
		// "signal" is an abort signal to abort this side effect if possible.
	});
	```

=== "No Build"
	```jsx
	import { TaskSlot } from "./gluon.js";

	const slot = new TaskSlot();

	// Queue a blocking task:
	const value = await slot.block(async () => {
		// ...
		return 42;
	});

	// Queue a side effect:
	slot.sideEffect(async signal => {
		// "signal" is an abort signal to abort this side effect if possible.
	});
	```

## Error Handling

+ Errors thrown in blocking tasks are thrown by the promise returned by the `block` function.
+ Errors thrown in side effects will cause unhandled rejections but will not affect the queue in any other way.
