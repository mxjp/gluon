# Error Handling
To keep the runtime as small as possible, gluon uses the error codes below instead of error messages.

## `G0`
**Teardown hooks are explicitly not supported in this context and registering them is very likely a mistake.**

This is thrown when registering teardown hooks in an expression or during [`nocapture`](./core/lifecycle.md#nocapture) calls. If you are sure that it's not a mistake if the teardown hook will never be called, you can ignore this error by using [`uncapture`](./core/lifecycle.md#uncapture).

## `G1`
**View boundary was not completely initialized.**

This is thrown when a [`View`](./core/views/index.md#implementing-views) did not complete boundary initialization during it's construction. This is always a bug in the view implementation and the author of that view should ensure, that all the view implementation requirements are met.

## `G2`
**View already has a boundary owner.**

[`Views`](./core/views/index.md#view-api) can only have one boundary owner at a time. This error is thrown when a previous owner wasn't disposed correctly or when the view is used in multiple places at once.

## `G3`
**Router is not available in the current context.**

This is thrown by the [`<Routes>`](./routing.md) component if no router has been provided via the current [`context`](./core/context.md).

## `G4`
**`onTeardownLeak` must only be called once and outside of any capture calls.**

[Leak detection](./testing.md#leak-detection) is meant for testing purposes. You need to ensure that `onTeardownLeak` is only called once per thread and before anything else is initialized.

## Handling Render Errors
Gluon has no dedicated error handling while rendering. If something in the synchronous render tree fails, the entire tree will fail to render.

To avoid this, you can use `try/catch` when needed:
```jsx
let inner: unknown;
try {
	inner = <SomethingDangerous />;
} catch (error) {
	console.error(error);
	inner = <div>An error occurred.</div>;
}

<>
	This may fail:
	{inner}
</>
```

You can also build a simple component to encapsulate this depending on your use case:
```jsx
function Try(props: {
	children: () => unknown;
	onError?: (error: unknown) => unknown;
}): unknown {
	// Without cleaning up teardown hooks:
	try {
		return props.children();
	} catch (error) {
		return props.onError(error);
	}

	// Or with cleaning up teardown hooks:
	return captureSelf(dispose => {
		try {
			return props.children();
		} catch (error) {
			dispose();
			return props.onError(error);
		}
	});
}

<Try onError={error => {
	console.error(error);
	return <>An error occurred.</>;
}}>
	{() => <SomethingDangerous>}
</Try>
```
