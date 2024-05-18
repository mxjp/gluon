---
order: 1
---

> This guide assumes that you have basic JavaScript knowledge. If not, [MDN](https://developer.mozilla.org/docs/Web/JavaScript) is a good place to start.

# Introduction
To develop a gluon application locally, you need a recent version of [NodeJS](https://nodejs.org/) or any other compatible JavaScript runtime.

You can use the commands below to setup a minimal gluon project using [Vite](https://vitejs.dev/) and [TypeScript](https://www.typescriptlang.org/):
```bash
# Create a "my-app" directory from gluon's "vite-ts" template project:
npx degit mxjp/gluon/templates/vite-ts my-app

# Move into "my-app":
cd my-app

# Install dependencies:
npm install

# Start a development server:
npm start
```

## Entry Point
After setting up the quick start template, you can find the main entry point in `src/main.tsx`:
```tsx
import { mount } from "@mxjp/gluon";

mount(
  document.body,
  <h1>Hello World!</h1>
);
```
The `<h1>Hello World!</h1>` expression directly creates an element and the `mount` function takes whatever content is supported by gluon and appends it to the document body.

## State & Reactivity
Reactivity is entirely based on signals which are objects that hold an arbitrary value:
```tsx
import { sig } from "@mxjp/gluon";

// Create a signal with the initial value 0:
const count = sig(0);
```
When a signal is used directly or it's value is accessed through a function call, the signal can notify it's dependants when the value changes:
```tsx
import { mount, sig } from "@mxjp/gluon";

const count = sig(0);

mount(
  document.body,
  <>
    {/* Using the signal directly is reactive: */}
    Current count: {count}

    {/* Accessing it's value through a function is reactive: */}
    Is even count: {() => (count.value & 1) === 0}

    {/*
      Using the value directly is not reactive because
      gluon has no way of re-evaluating the expression:
    */}
    Initial count: {count.value}
  </>
);
```
To replace a signal value, you can set the `value` property:
```tsx
count.value = 1;
```
To update an object, you can use the `update` function.
```tsx
const values = sig([7, 42]);

// This will modify the inner value and then notify dependants:
values.update(values => {
  values.push(77);
});

// Note, that deeply modifying objects directly does nothing:
values.value.push(77);
```

## Basic Rendering
JSX expressions directly create HTML elements:
```tsx
<button>Click me!</button>
```

By default, attribute names are the same as in HTML:
```tsx
<img alt="An image" src="..." />
```

Attributes, set to `false`, `undefined` or `null` are removed. `true` is set as an empty string:
```tsx
<input disabled={false} /> // <input>
<input disabled={true} /> // <input disabled="">
```

Attributes prefixed with `prop:` are set using JavaScript properties:
```tsx
<input type="text" prop:value="Hello World!" />
```

## Event Listeners
Attributes prefixed with `$` are added as event listeners. For capturing event listeners use `$$`.
```tsx
<button $click={event => {
  console.log("Clicked", event.target);
}}>Click me!</button>
```

## Conditional Rendering
To render conditional or repeated content gluon uses so called **Views** which are sequences of DOM nodes that can change over time.

The `Show` component renders content when a condition is met:
```tsx
import { mount, sig, Show } from "@mxjp/gluon";

const showMessage = sig(false);

mount(
  document.body,
  <>
    <button $click={() => { showMessage.value = !showMessage.value }}>
      Toggle message
    </button>

    <Show when={showMessage}>
      {() => <h1>Hello World!</h1>}
    </Show>
  </>
);
```

The `For` component repeats content for each unique item in an iterable:
```tsx
import { mount, sig, For } from "@mxjp/gluon";

const values = sig([]);

mount(
  document.body,
  <>
    <button $click={() => { values.update(v => v.push(Date.now())) }}>
      Add current time
    </button>

    <ul>
      <For each={values}>
        {value => <li>{value}</li>}
      </For>
    </ul>
  </>
);
```

In addition to `Show` and `For`, gluon provides some more view types you can find in the API documentation or you can implement your own views for special use cases.

## Components
Components in gluon are just functions that return arbitrary content. They are called once when the component is rendered.
```tsx
function Message() {
  return <h1>Hello World!</h1>;
}

// Using the component:
<Message />;
```

Properties are passed as is via the `props` argument. Properties are static by default.
```tsx
function Message(props: { message: string; }) {
  return <h1>{props.message}</h1>;
}

// Using the component:
<Message message="Hello World!" />;
```

To make properties reactive, you can use the `Expression` type which can be a static value, a signal or a function:
```tsx
import { Expression } from "@mxjp/gluon";

function Message(props: { message: Expression<string>; }) {
  return <h1>{props.message}</h1>;
}

// Using the component:
<Message message="Hello World!" />;
<Message message={() => "Hello World!"} />;
<Message message={someSignal} />;
```

To compute something from an expression value or evaluate it, you can use the `map` and `get` functions:
```tsx
import { Expression, map, get } from "@mxjp/gluon";

function Message(props: { message: Expression<string>; }) {
  console.log("Initial message:", get(props.message));
  return <h1>{map(props.message, m => m.toUpperCase())}</h1>;
}
```

To allow components to update a value, you can use the `Signal` type:
```tsx
import { mount, sig, Signal } from "@mxjp/gluon";

function TextInput(props: { value: Signal<string>; }) {
  return <input
    type="text"
    prop:value={props.value}
    $input={event => {
      props.value.value = (event.target as HTMLInputElement).value;
    }}
  />;
}

const text = sig("Hello World!");
<TextInput value={text} />;
```

Component children are passed via the `children` property:
```tsx
function Message(props: { children?: unknown; }) {
  return <h1>{props.children}</h1>;
}

<Message>Hello World!</Message>;
```
