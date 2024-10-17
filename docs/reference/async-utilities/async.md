# `<Async>`
The `<Async>` component is meant for asynchronous rendering. E.g. loading page content.

=== "JSX"
	```jsx
	import { Async } from "rvx/async";

	// main.tsx:
	<Async source={() => import("./page")}>
		{page => <page.content />}
	</Async>

	// page.tsx:
	export function content() {
		return <h1>Hello World!</h1>;
	}
	```

=== "No Build"
	```jsx
	import { Async } from "./rvx.js";

	// main.js:
	Async({
		source: () => import("./page"),
		children: page => page.content(),
	})

	// page.js:
	export function content() {
		return e("h1").append("Hello World!");
	}
	```

The `rejected` and `pending` properties can be used for rendering content when the promise is rejected or pending:

=== "JSX"
	```jsx
	<Async
		source={() => import("./page")}
		pending={() => <>Loading...</>}
		rejected={error => <>Error: {error}</>}
	>
		{page => <page.content />}
	</Async>
	```

=== "No Build"
	```jsx
	Async({
		source: () => import("./page"),
		pending: () => "Loading...",
		rejected: error => ["Error: ", error],
		children: page => page.content(),
	})
	```

## Tracking Completion
To wait for async parts in a specific context to complete, you can use `AsyncContexts`:

=== "JSX"
	```jsx
	import { Inject } from "rvx";
	import { ASYNC, Async, AsyncContext } from "rvx/async";

	const ctx = new AsyncContext();

	<Inject key={ASYNC} value={ctx}>
		{() => <Async>...</Async>}
	</Inject>

	// Wait for all "<Async>" parts to complete and re-throw unhandled errors:
	await ctx.complete();

	// Or manually track an async task:
	ctx.track(fetch("something"));
	```

=== "No Build"
	```jsx
	import { inject, ASYNC, Async, AsyncContext } from "./rvx.js";

	const ctx = new AsyncContext();

	inject(ASYNC, ctx, () => {
		return Async({ ... });
	})

	// Wait for all "<Async>" parts to complete and re-throw unhandled errors:
	await ctx.complete();

	// Or manually track an async task:
	ctx.track(fetch("something"));
	```

### Revealing Content At Once
When there are multiple async parts in the same place, tracking can be used to hide an entire area and show it once all of the inner async parts have completed.

=== "JSX"
	```jsx
	import { Inject, sig, movable } from "rvx";
	import { ASYNC, Async, AsyncContext } from "rvx/async";

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

=== "No Build"
	```jsx
	import { inject, sig, movable, ASYNC, Async, AsyncContext } from "./rvx.js";

	const innerCtx = new AsyncContext();
	const inner = movable(inject(ASYNC, innerCtx, () => [
		Async({ ... }),
		Async({ ... }),
		Async({ ... }),
	]));

	Async({
		source: innerCtx.complete(),
		children: () => inner.move(),
	})
	```

## Dynamic Sources
The `<Show>` or `<Nest>` components can be used to replace the `source` property over time:

=== "JSX"
	```jsx
	<Show when={someSignal}>
		{source => <Async source={source}>...</Async>}
	</Show>
	```

=== "No Build"
	```jsx
	Show({
		when: someSignal,
		children: source => Async({ source, ... })
	})
	```

The example below fetches a file and aborts pending requests when the file name is changed early:

=== "JSX"
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

=== "No Build"
	```jsx
	const name = sig("example.txt");

	Nest({
		children: () => {
			const value = name.value;
			return () => Async({
				source: fetch(value, { signal: useAbortSignal() }).then(r => r.text()),
				children: text => e("pre").append(text),
			});
		},
	})
	```
