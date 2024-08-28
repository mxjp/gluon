# Components
In gluon, components are functions that return any type of [supported content](elements.md#content).
```jsx
function Message() {
	return <h1>Hello World!</h1>;
}

<Message />
```

## Properties
Properties are passed via the first argument as is:
```jsx
function Message(props: { text: string; }) {
	return <h1>{props.text}</h1>;
}

<Message text="Hello World!" />
```

Children are passed as the `children` property.
```jsx
function Message(props: { children?: unknown; }) {
	return <h1>{props.children}</h1>;
}

<Message>Hello World!</Message>
```

### Expressions
By default, all component properties are static. To accept reactive inputs, use the [`Expression`](signals.md#expressions) type.
```jsx
import { Expression } from "@mxjp/gluon";

function Counter(props: { value: Expression<number>; }) {
	return <>Current count: {props.value}</>;
}

const count = sig(42);

// Static values:
<Counter value={count.value} />

// Reactive values:
<Counter value={count} />
<Counter value={() => count.value} />
```

### Signals
To support data flow in both directions, you can use [signals](signals.md) as properties.
```jsx
function Counter(props: { value: Signal<number>; }) {
	return <button $click={() => { props.value++ }}>
		Count: {props.value}
	</button>;
}

const count = sig(0);
<Counter value={count} />
```
Using signals for two way data flow also allows converting values in both directions in a nicely composable way.

The example below shows a basic text input and a `trim` function for trimming user input:
```jsx
function TextInput(props: { value: Signal<string>; }) {
	return <input
		type="text"
		prop:value={props.value}
		$input={event => {
			props.value.value = (event.target as HTMLInputElement).value;
		}}
	/>;
}

function trim(source: Signal<string>) {
	const input = sig(source.value);

	// Update the source signal if the input changes:
	watchUpdates(input, value => {
		source.value = value.trim();
	});

	// Update the input signal if the source changes:
	watchUpdates(source, value => {
		if (value !== input.value.trim()) {
			input.value = value;
		}
	});

	return input;
}

const text = sig("");

// This input uses the "text" signal as is:
<TextInput value={text} />

// This input uses the "trim" function to store the
// trimmed version of the input in the "text" signal:
<TextInput value={trim(text)} />

// The signal's pipe function does the same but is more
// readable when using multiple conversions:
<TextInput value={text.pipe(trim).pipe(...)} />
```

### Forwarding special attributes
Sometimes it can be useful to forward properties to the root element of a component for allowing the user of the component to set the `class`, `style` or any other attributes.
```jsx
import { ClassValue, StyleValue } from "@mxjp/gluon";

function Button(props: {
	class?: ClassValue;
	style?: StyleValue;
	id?: Expression<string | undefined>;
	...
}) {
	return <button
		class={props.class}
		style={props.style}
		id={props.id}
	>...</button>;
}
```

In case of the `class` and `style` attributes, you can use an array as value to mix properties with values from within your component:
```tsx
import { ClassValue, StyleValue } from "@mxjp/gluon";

function Button(props: {
	class?: ClassValue;
	style?: StyleValue;
	...
}) {
	return <button
		class={[props.class, "example"]}
		style={[props.style, { color: "red" }]}
		...
	>...</button>;
}
```


## Lifecycle Hooks
Since components are just functions, you can register [teardown hooks](./lifecycle.md) to be called when your component is disposed.
```jsx
function Timer() {
	const elapsed = sig(0);
	const timer = setInterval(() => { elapsed.value++ }, 1000);
	teardown(() => clearInterval(timer));
	return elapsed;
}
```
