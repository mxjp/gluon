# Error Handling

## Rendering
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
