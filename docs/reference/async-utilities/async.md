# `<Async>`
The `<Async>` component is meant for asynchronous rendering. E.g. loading page content.
```jsx
import { Async } from "@mxjp/gluon/async";

// main.tsx:
<Async source={() => import("./page")}>
	{page => <page.content />}
</Async>

// page.tsx:
export function content() {
	return <h1>Hello World!</h1>;
}
```

The `rejected` and `pending` properties can be used for rendering content when the promise is rejected or pending:
```jsx
<Async
	source={() => import("./page")}
	pending={() => <>Loading...</>}
	rejected={error => <>Error: {error}</>}
>
	{page => <page.content />}
</Async>
```

## Tracking Completion
To wait for async parts in a specific context to complete, you can use `AsyncContexts`:
```jsx
import { Inject } from "@mxjp/gluon";
import { ASYNC, Async, AsyncContext } from "@mxjp/gluon/async";

const ctx = new AsyncContext();

<Inject key={ASYNC} value={ctx}>
	{() => <Async>...</Async>}
</Inject>

// Wait for all "<Async>" parts to complete and re-throw unhandled errors:
await ctx.complete();

// Or manually track an async task:
ctx.track(fetch("something"));
```

### Revealing Content At Once
When there are multiple async parts in the same place, tracking can be used to hide an entire area and show it once all of the inner async parts have completed.
```jsx
import { Inject, sig, movable } from "@mxjp/gluon";
import { ASYNC, Async, AsyncContext } from "@mxjp/gluon/async";

const innerCtx = new AsyncContext();
const inner = movable(
	<Inject key={ASYNC} value={innerCtx}>
		{() => <>
			<Async>...</Async>
			<Async>...</Async>
			<Async>...</Async>
		</>}
	</Inject>
);

<Async source={innerCtx.complete()}>
	{() => inner.move()}
</Async>
```

## Dynamic Sources
The `<Show>` or `<Nest>` components can be used to replace the `source` property over time:
```jsx
<Show when={someSignal}>
	{source => <Async source={source}>...</Async>}
</Show>
```

The example below fetches a file and aborts pending requests when the file name is changed early:
```jsx
const name = sig("example.txt");

<Nest>
	{() => {
		const value = name.value;
		return () => <Async source={fetch(value, { signal: useAbortSignal() }).then(r => r.text())}>
			{text => <pre>{text}</pre>}
		</Async>;
	}}
</Nest>
```
