![](./assets/banner.svg)

# gluon!
This is a signal based rendering library which aims to:
+ be usable with widely adopted build systems
+ be as simple as possible without breaking at edge cases
+ avoid [maintenance overhead](#shared-globals--compatibility) for long living projects

## Stability Warning
This is an early in-development version with [frequent breaking changes](https://github.com/mxjp/gluon/blob/main/CHANGELOG.md).

## [Documentation](#documentation-1)

<br>



# Quick Start
If you want to try gluon, you can use the commands below to setup a minimal gluon project with Vite and TypeScript.
```bash
# Download the minimal template into "my-app":
npx degit mxjp/gluon/templates/vite-ts my-app
cd my-app
# Install dependencies:
npm install
# Start a development server:
npm start
```

## Introduction
After setting up the quick start template, you can find the main entry point in **src/main.tsx**:
```tsx
import { mount } from "@mxjp/gluon";

// This renders content and appends it to the document body:
mount(
  document.body,
  <h1>Hello World!</h1>
);
```

Reactivity is entirely based on [signals](#signals) which are just objects with a value that can be watched for changes. Signals or functions that access a signal value can be used as attributes and content.<br>
The example below renders a button that increments a counter when clicked:
```tsx
import { mount, sig } from "@mxjp/gluon";

// Create a signal with the initial value "0":
const count = sig(0);

mount(
  document.body,
  <button $click={() => {
    // Setting the value updates all places it's used at:
    count.value++;
  }}>
    Clicked {count} times
  </button>
);
```

Instead of using the **count** signal directly, you can also use it in a function that accesses it's value for arbitrary computations:
```tsx
import { mount, sig } from "@mxjp/gluon";

const count = sig(0);

mount(
  document.body,
  <button $click={() => { count.value++ }}>
    Clicked {() => count.value} times
  </button>
);
```

To render conditional or repeated content, [views](#views) are used which are sequences of nodes that may change themselves.<br>
The example below creates a button to show or hide a message. The function inside the **When** component renders content every time, it's **value** property evaluates to some truthy value:
```tsx
import { mount, sig, When } from "@mxjp/gluon";

const show = sig(false);

mount(
  document.body,
  <>
    <button $click={() => { show.value = !show.value }}>Toggle message</button>
    <When value={show}>
      {() => <h1>Hello World!</h1>}
    </When>
  </>
);
```

To organize your code in [components](#components), you can create a function that returns rendered content. Properties are passed with the first **props** argument.<br>
The example below shows a counter component with an optional initial value:
```tsx
import { mount, sig } from "@mxjp/gluon";

function Counter(props: { start?: number }) {
  const count = sig(props.start ?? 0);
  return <button $click={() => { count.value++ }}>
    Clicked {count} times
  </button>;
}

mount(
  document.body,
  <>
    <Counter />
    <Counter start={7} />
  </>
);
```

Note, that the **start** property in the example above is not reactive. To accept reactive properties, the [Expression](#expressions) type can be used.<br>
The example below shows a component that reactively displays a count:
```tsx
import { mount, sig, Expression } from "@mxjp/gluon";

function Count(props: { count: Expression<number> }) {
  return <>
    Current count: {props.count}
  </>;
}

const count = sig(0);

mount(
  document.body,
  <>
    <button $click={() => { count.value++ }}>Increment</button>
    <Count count={count} />
  </>
);
```

To map the value of an expression, use the **map** function:
```tsx
import { Expression, get } from "@mxjp/gluon";

function Count(props: { count: Expression<number> }) {
  return <>Current count: {map(props.count, count => {
    return "0x" + count.toString(16);
  })}</>;
}
```

To access the value of an expression at any time, use the **get** function:
```tsx
import { Expression, get } from "@mxjp/gluon";

function Count(props: { count: Expression<number> }) {
  console.log("Initial count:", get(props.count));

  return <>Current count: {props.count}</>;
}
```

To allow a component to change a value, you can either use signals or callbacks:
```tsx
import { mount, sig, Signal } from "@mxjp/gluon";

function IncrementButton(props: { value: Signal<number> }) {
  return <button $click={() => { props.count.value++ }}>Increment</button>;
}

const count = sig(0);

mount(
  document.body,
  <>
    <IncrementButton count={count} />
    Clicked {count} times
  </>
)
```

<br>



# Documentation
+ [Installation](#installation)
  + [JSX](#jsx)
    + [TypeScript](#typescript)
    + [Babel](#babel)
    + [esbuild & Vite](#esbuild--vite)
    + [Other Build Systems](#other-build-systems)
  + [Buidless Options](#buildless-options)
    + [Custom Bundles](#custom-bundles)
+ [Rendering](#rendering)
  + [Attributes](#attributes)
    + [Classes](#classes)
    + [Styles](#styles)
    + [Events](#events)
  + [Content](#content)
    + [Text](#text)
    + [Nodes](#nodes)
    + [Views](#views)
      + [`<Show>`](#show)
      + [`<Nest>`](#nest)
      + [`<For>`](#for)
      + [`<IndexFor>`](#indexfor)
      + [`<Attach>`](#attach)
      + [movable](#movable)
    + [Hidden Content](#hidden-content)
    + [Fragments & Arrays](#fragments--arrays)
  + [Namespaces](#namespaces)
  + [Components](#components)
    + [Children](#children)
+ [Reactivity](#reactivity)
  + [Signals](#signals)
  + [Expressions](#expressions)
  + [Conversion](#conversion)
+ [Lifecycle](#lifecycle)
+ [Context](#context)
  + [Typed Keys](#typed-keys)
  + [Async Code](#async-code)
+ [Performance](#performance)
  + [Update Batching](#update-batching)
  + [Lazy Expressions](#lazy-expressions)
    + [Memos](#memos)
+ [Async Utilities](#async-utilities)
  + [Tasks](#tasks)
  + [Async](#async)
  + [Abort Controllers](#abort-controllers)
+ [Routing](#routing)
  + [Route Matching](#route-matching)
  + [Path Normalization](#path-normalization)
  + [Navigation](#navigation)
  + [Nested Routing](#nested-routing)
+ [Web Components](#web-components)
  + [Reflecting Attributes](#reflecting-attributes)
  + [Manual Implementation](#manual-implementation)
+ [State Management](#state-management)
  + [Updates](#updates)
  + [Classes](#classes-1)
    + [Private Fields](#private-fields)
+ [Troubleshooting](#troubleshooting)
  + [Missing Context Values](#missing-context-values)
  + [Reactivity Not Working](#reactivity-not-working)
+ [Testing](#testing)
  + [Synchronous Tests](#synchronous-tests)
  + [Asynchronous Tests](#asynchronous-tests)
  + [Waiting For Expressions](#waiting-for-expressions)
  + [Leak Detection](#leak-detection)
  + [Concurrency](#concurrency)
+ [Shared Globals & Compatibility](#shared-globals--compatibility)
+ [Security](#security)

<br>



# Installation
Gluon is available as an [npm package](https://www.npmjs.com/package/@mxjp/gluon).
```bash
npm i @mxjp/gluon
```

## JSX
Gluon provides a react 17 JSX runtime and a legacy runtime in case your build tool dosn't support the new runtime.

### TypeScript
To use JSX with typescript, add the following options to your tsconfig:
```js
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@mxjp/gluon"
  }
}
```

### Babel
When using TypeScript, it is recommended to use the [compiler options](#typescript) specified abvove instead.

If you are using Babel with plain JavaScript, you can use the **@babel/plugin-transform-react-jsx** plugin with the following babel options:
```js
{
  "plugins": [
    [
      "@babel/plugin-transform-react-jsx",
      {
        "runtime": "automatic",
        "importSource": "@mxjp/gluon"
      }
    ]
  ]
}
```

### esbuild & Vite
When using TypeScript, it is recommended to use the [compiler options](#typescript) specified abvove instead.

If you are using esbuild or vite with plain JavaScript, you can add the options below:
```js
// esbuild.config.mjs
import * as esbuild from "esbuild";

await esbuild.build({
  jsx: "automatic",
  jsxImportSource: "@mxjp/gluon",
});
```
```js
// vite.config.mjs
import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "@mxjp/gluon",
  },
});
```

### Other Build Systems
Although not documented here, you can also use any other build system that supports JSX.

To use the react 17 runtime (also called "automatic runtime"), use **@mxjp/gluon** as the import source.

To use the legacy runtime, you can manually import the `jsx` factory and the `Fragment` factory or automatically inject it using your build tool:
```jsx
import { jsx, Fragment } from "@mxjp/gluon/jsx";
```

## Buildless Options
You can also use gluon without any build system by directly using one of the es module bundles listed below. Note, that these bundles don't include any JSX related code and components.

| Modules | Human Readable | Minified | Types |
|-|-|-|-|
| Core | [gluon.js](https://unpkg.com/@mxjp/gluon/dist/gluon.js) | [gluon.min.js](https://unpkg.com/@mxjp/gluon/dist/gluon.min.js) | [gluon.d.ts](https://unpkg.com/@mxjp/gluon/dist/gluon.d.ts) |
| Core, Async, Router | [gluon.all.js](https://unpkg.com/@mxjp/gluon/dist/gluon.all.js) | [gluon.all.min.js](https://unpkg.com/@mxjp/gluon/dist/gluon.all.min.js) | [gluon.all.d.ts](https://unpkg.com/@mxjp/gluon/dist/gluon.all.d.ts) |

### Custom Bundles
If the bundles above don't fit your needs, you can build a custom bundle that only includes the modules you need:
```bash
git clone https://github.com/mxjp/gluon
cd gluon

npm ci
node scripts/bundle.js [...args]

# Bundle "core" and "async" into "./custom.js", "./custom.min.js" and "./custom.d.ts":
node scripts/bundle.js -m core async -o ./custom
```
+ `--modules | -m <...modules>`
  + Specify what modules to include.
  + This can be any directory or filename that exists in the [src](https://github.com/mxjp/gluon/tree/main/src) directory without file extension.
  + Default is `core`
+ `--output | -o <path>`
  + Specify the output path of the bundle without extension.
  + Default is `./dist/gluon.custom`

<br>



# Rendering
JSX expressions and the **e** function create elements directly.
```tsx
import { e } from "@mxjp/gluon";

<div /> instanceof HTMLDivElement; // true

e("div") instanceof HTMLDivElement; // true
```

## Attributes
Attributes are set using **setAttribute** or **removeAttribute** by default.
+ Attributes set to **null**, **undefined** or **false** are removed.
+ Attributes set to **true** are set as an empty string.
+ All other values are set as strings.
+ The [**class**](#classes) and [**style**](#styles) attributes are set as described below.
+ Attributes prefixed with `prop:` are set as properties.
+ Attributes prefixed with `attr:` are always set using the default behavior.

```tsx
import { mount } from "@mxjp/gluon";

mount(
  document.body,
  <input
    type="text"
    prop:value="Some text"
  />,
);
```

Attribute values can be expressions.
```tsx
import { mount, sig } from "@mxjp/gluon";

const message = sig("Hello World!");

mount(document.body, [
  // Static value:
  <div title="Hello World!" />,
  <div title={"Hello World!"} />,

  // Signals:
  <div title={message} />,

  // Functions:
  <div title={() => message.value} />,
]);
```

### Classes
The **class** attribute can be any combination of strings, arrays and objects with boolean expresions to determine which classes are added. Undefined, null and false is ignored.
```tsx
import { mount } from "@mxjp/gluon";

mount(
  document.body,
  <>
    <div class="example" />
    <div class={[
      "foo",
      () => "bar",
      {
        baz: true,
        boo: () => false,
      },
    ]} />
  </>
);
```

Note, that all expressions used in the class attribute are evaluated for every signal update. To avoid expensive computations, use [lazy](#lazy-expressions) or [memo](#memos).

### Styles
The **style** attribute can be any combination of arrays, objects and expressions.

Properties use the same casing as in css.
```tsx
import { mount, sig } from "@mxjp/gluon";

const someSignal = sig("42px");

mount(
  document.body,
  <>
    <div style={{ color: "red" }} />
    <div style={() => [
      {
        color: "red",
        "font-size": "1rem",
      },
      { color: () => "blue" },
      { color: someSignal },
      [
        { width: "42px" },
      ],
    ]} />
  </>
);
```

Note, that properties that are no longer specified after a signal update are not reset automatically to keep the current implementation simple. When properties are specified multiple times, the last one is used.

### Events
Attributes that start with **$** are added as event listeners. Attributes starting with **$$** are added as capturing event listeners.
```tsx
import { mount } from "@mxjp/gluon";

mount(
  document.body,
  <button $click={event => {
    console.log("Button was clicked!", event.target);
  }}>Click me!</button>,
);
```

## Content

### Text
Expressions (static values, signals and functions) are rendered as text content. Null and undefined are not displayed.
```tsx
import { mount } from "@mxjp/gluon";

mount(
  document.body,
  <div>
    Static text
    {"Static text"}
    {someSignal}
    {() => someSignal.value}
  </div>,
);
```

### Nodes
Any DOM nodes are used as is.
```tsx
import { mount } from "@mxjp/gluon";

mount(
  document.body,
  <div>
    <div />
    {document.createElement("div")}
  </div>,
);
```
Note, that document fragments are not cloned automatically and child nodes are removed from the document fragment as soon as the rendered view is used or removed.

### Views
Views are sequences of one or more nodes that change over time. They can be used to render collections or conditional content.

#### `<Show>`
Render conditional content or optional fallback content.

Content is rerendered if the expression result is not strictly equal to the last one. To keep content alive when the condition is falsy, use [`<Attach>`](#attach) instead.
```tsx
import { mount, Show, sig } from "@mxjp/gluon";

const message = sig(null);

mount(
  document.body,
  <Show when={message} else={() => <>No message to render.</>}>
    {message => <h1>{message}</h1>}
  </Show>
);
```

#### `<Nest>`
Render a [component](#components) returned from an expression.

Content is rerendered every time the expression is rerun.

For simple conditional content, prefer using [`<Show>`](#show).
```tsx
import { mount, Nest, sig } from "@mxjp/gluon";

const message = sig({
  type: "foo",
  text: "Hello World!",
});

mount(
  document.body,
  <Nest>
    {() => {
      const current = message.value;
      switch (current.type) {
        case "foo": return () => (<h1>{current.text}</h1>);
        case "bar": ...;
      }
    }}
  </Nest>
);
```

#### `<For>`
Render content for each unique value in an iterable. Items are rendered in iteration order and duplicates are silently ignored.

The **index** parameter is a function that can be used to reactively get the current index.
```tsx
import { mount, For, sig } from "@mxjp/gluon";

const items = sig(["foo", "bar", "bar", "baz"]);

mount(
  document.body,
  <ul>
    <For each={items}>
      {(value, index) => <li>{() => index() + 1}: {value}</li>}
    </For>
  </ul>
);
```

#### `<IndexFor>`
Render content for each index-value pair in an iterable. Items are rendered in iteration order.
```tsx
import { mount, IndexFor, sig } from "@mxjp/gluon";

const items = sig(["foo", "bar", "bar", "baz"]);

mount(
  document.body,
  <ul>
    <IndexFor each={items}>
      {(value, index) => <li>{index + 1}: {value}</li>}
    </IndexFor>
  </ul>
);
```

#### `<Attach>`
Attach content if an expression is truthy.

```tsx
import { mount, Show, sig } from "@mxjp/gluon";

const showMessage = sig(false);

mount(
  document.body,
  <Show when={showMessage}>
    Hello World!
  </Show>
);
```
To conditionally render content, use [`<Show>`](#show) or [`<Nest>`](#nest) instead.

#### `movable`
The **movable** function wraps content, so that it can be safely moved to new places. When moved, content is safely detached from it's previous parent.
```tsx
import { mount, movable } from "@mxjp/gluon";

const content = movable(<>Hello World!</>);

mount(
  document.body,
  <>
    {content.move()}
  </>
);

// Move "content" into a new place:
mount(
  document.body,
  <>
    {content.move()}
  </>
);

// Detach "content" from it's previous place:
content.detach();
```

### Fragments & Arrays
Content can be wrapped in arbitrarily nested arrays and jsx fragments.
```tsx
import { mount } from "@mxjp/gluon";

mount(
  document.body,
  <>
    {[
      "Hello World!",
      <div />,
    ]}
  </>,
);
```

Jsx fragments return their children as is.
```tsx
<>Hello World!</>; // => string
<>foo{42}</>; // => ["foo", 42]
```

## Namespaces
By default, elements are created as HTML elements. This works fine for most cases, but requires some extra work to create **SVG** or **MathML** elements.

The namespace URI for new elements can be set via [contexts](#context).
```tsx
import { mount, Inject, XMLNS, SVG } from "@mxjp/gluon";

mount(
  document.body,
  <div>
    <Inject key={XMLNS} value={SVG}>
      {() => <svg version="1.1" viewBox="0 0 100 100">...</svg>}
    </Inject>
  </div>,
);
```

## Components
In gluon, components are functions that return content and take arbitrary inputs. When used with JSX syntax, props are passed as the first argument.
```tsx
import { mount, Signal } from "@mxjp/gluon";

function TextInput(props: {
  text: Signal<string>,
}) {
  return <input
    type="text"
    value={props.text}
    $input={event => {
      props.text.value = event.target.value;
    }}
  />;
}

const text = sig("");
mount(
  document.body,
  <>
    <TextInput text={text} />
    You typed <b>{text}</b>.
  </>,
);
```

By default, properties are non-reactive. To accept reactive properties, you can use [expressions](#reactivity). To map an expression value, use the **map** function, to access an expression value at any time use the **get** function:
```tsx
import { mount, get, Expression } from "@mxjp/gluon";

import classes from "./example.module.css";

function Hint(props: {
  variant: Expression<"error" | "info">,
  children: unknown,
}) {
  console.log("Initial value:", get(props.variant));

  return <div class={map(props.variant, variant => classes[variant])}>
    {props.children}
  </div>;
}

mount(
  document.body,
  <>
    <Hint variant="error">Hello World!</Hint>
    <Hint variant={() => "info"}>Hello World!</Hint>
    <Hint variant={someSignal}>Hello World!</Hint>
  </>,
);
```

### Children
Component children are always passed via the **children** property.

To accept arbitrary content with it's [lifecycle](#lifecycle) bound to the parent, you can use the **unknown** type:
```tsx
import { mount } from "@mxjp/gluon";

function TextBlock(props: { children?: unknown }) {
  return <div>
    {props.children}
  </div>;
}

mount(
  document.body,
  <TextBlock>
    Hello World!
  </TextBlock>
);
```

You can also use arbitrary functions to render children multiple times or to pass values:
```tsx
import { mount, For } from "@mxjp/gluon";

function ForEachNote(props: { children: (note: string) => unknown }) {
  return <ul>
    <For each={someNotes}>
      {note => <li>
        {props.children(note)}
      </li>}
    </For>
  </ul>;
}

mount(
  document.body,
  <ForEachNote>
    {note => <div>
      <h2>{note.title}</h2>
      <p>{note.content}</p>
    </div>}
  </ForEachNote>
);
```

<br>



# Reactivity
Reactivity in gluon is entirely based on [signals](#signals) and [expressions](#expressions).

## Signals
**Signals** represent values that change over time. They keep track of their dependants when accessed and notify them when updated.

```tsx
import { sig } from "@mxjp/gluon";

// Create a signal with an initial value:
const count = sig(0);

// "value" can be used to access and update the value:
count.value++;
console.log(count.value); // 1

// Signals can contain any arbitrary value:
const items = sig<string[]>([]);

// "update" allows modifying the inner value in place:
items.update(items => {
  items.push("foo");
});
```

## Expressions
**Expressions** can be static values, signals or functions to access or compute a value. Expressions can be watched manually or used as attributes and element content to render text.
```tsx
import { mount, sig, watch } from "@mxjp/gluon";

// Create a signal:
const count = sig(0);

// Render a button and text that displays the count:
mount(
  document.body,
  <>
    <button $click={() => { count.value++ }}>Click me!</button>
    Clicked {count} times!
  </>
);

// Watch the count manually:
watch(count, count => {
  console.log(`Clicked ${count} times!`);
});

watch(() => count.value, count => {
  console.log(`Clicked ${count} times!`);
});
```

Note, that static values will not be reactive, even if they originate from a signal:
```tsx
import { sig } from "@mxjp/gluon";

const count = sig(0);

watch(count.value, count => {
  // This is only called once, even if count is updated:
  console.log(`Clicked ${count} times!`);
});
```

The **watchUpdates** function can be used as an alternative, that returns the initial value instead of immediately calling a function with it:
```tsx
import { sig, watchUpdates } from "@mxjp/gluon";

const count = sig(0);

const initialValue = watchUpdates(count, count => {
  console.log(`Count updated: ${count}`);
});

console.log("Initial count:", initialValue);
```

The **effect** function can be used when separation of expressions and side effects isn't desired:
```tsx
import { effect } from "@mxjp/gluon";

const count = sig(0);

effect(() => {
  console.log(count.value);
});
```

## Conversion
Sometimes it can be useful to convert user inputs in some way, e.g. trimming whitespace or parsing a number.

The example below shows how signals can be converted while allowing data flow in both directions. Things like the **trim** function below are easy to reuse and compose with other behaviors.
```tsx
import { sig, Signal, watchUpdates, mount } from "@mxjp/gluon";

export function trim(source: Signal<string>): Signal<string> {
  const input = sig(source.value);

  // Write the trimmed value back into source when the input is updated:
  watchUpdates(input, value => {
    source.value = value.trim();
  });

  // Write the source value into the input if it doesn't match the trimmed input:
  watchUpdates(source, value => {
    if (value !== input.value.trim()) {
      input.value = value;
    }
  });

  return input;
}

// Create the source signal:
// This will contain the trimmed version of the raw input value.
const text = sig("Hello World!");

// Basic text input component that uses a signal for the value:
function TextInput(props: { value: Signal<string> }) {
  return <input
    prop:value={props.value}
    $input={event => {
      props.value.value = event.target.value;
    }}
  />;
}

mount(
  document.body,
  <TextInput value={trim(text)} />
);
```



# Lifecycle
In gluon, teardown hooks are the only lifecycle primitive. They can be used to run logic, when the context, they have been registered in is disposed.
```tsx
import { capture, teardown } from "@mxjp/gluon";

// Capture teardown hooks during a function call:
const dispose = capture(() => {
  // Register a teardown hook:
  teardown(() => {
    console.log("Cleanup things...");
  });
});

// Call captured teardown hooks:
dispose();
```

Teardown hooks can be used in **watch** and **view** callbacks.
```tsx
import { mount, sig, IterUnique, teardown } from "@mxjp/gluon";

const items = sig(["foo", "bar", "baz"]);

mount(
  document.body,
  <IterUnique each={items}>
    {item => {
      console.log("Rendering:", item);
      teardown(() => {
        console.log("Removing:", item);
      });
      return <li>{item}</li>;
    }}
  </IterUnique>
);
```

<br>



# Context
Contexts can be used to pass key-value pairs along the call stack without requiring intermediaries to know about them.
```tsx
import { inject, extract } from "@mxjp/gluon";

// Inject a key-value pair:
inject("message", "Hello World!", () => {
  // Extract a value by key:
  console.log("Message:", extract("message"));
});
```

Contexts automatically work with all synchronous code and all gluon APIs:
```tsx
import { mount, When, Inject, extract } from "@mxjp/gluon";

mount(
  document.body,
  <Inject key="message" value="Hello World!">
    {() => <When value={someSignal}>
      {() => <h1>{extract("message")}</h1>}
    </When>}
  </Inject>
);
```

## Typed Keys
Context values are typed as `unknown` by default.

To use typed context values, you can use symbols in combination with the `ContextKey` type as keys:
```tsx
import {} from "@mxjp/gluon";

const MESSAGE = Symbol("message") as ContextKey<string>;

inject(MESSAGE, "Hello World!", () => {
  extract(MESSAGE); // Type: string | undefined
});

// This is a compiler error:
inject(MESSAGE, 42, () => { ... });
```

## Async Code
To make contexts work with other asynchronous code, you can manually run functions in a different context:
```tsx
import { inject, getContext, runInContext } from "@mxjp/gluon";

inject("message", "Hello World!", () => {
  const context = getContext();

  queueMicrotask(() => {
    console.log(extract("message")); // => undefined

    runInContext(context, () => {
      console.log(extract("message")); // => "Hello World!"
    });
  });
});
```

<br>



# Performance

## Update Batching
Signal updates are processed immediately by default. This can lead to update overhead when updating many signals at once that are all used in the same expression:
```tsx
import { sig, watch } from "@mxjp/gluon";

const a = sig(0);
const b = sig(42);
const c = sig(7);

watch(() => a.value + b.value + c.value, sum => {
  console.log(sum);
});

// The watch callback is called for each individual update:
a.value++;
b.value++;
c.value++;
```

To avoid this, signal updates can be deferred, deduplicated and processed immediately after all signals have been updated:
```tsx
import { sig, watch, batch } from "@mxjp/gluon";

const a = sig(0);
const b = sig(42);
const c = sig(7);

watch(() => a.value + b.value + c.value, sum => {
  console.log(sum);
});

// Defer and update all signals at once:
batch(() => {
  a.value++;
  b.value++;
  c.value++;
});
```

## Lazy Expressions
When an expression is used in multiple places, it is also evaluated multiple times for each signal update. This can lead to performance problems when the expression is computationally expensive.
```tsx
import { sig, watch } from "@mxjp/gluon";

const input = sig(0);

const expression = () => expensiveComputation(input.value);

// "expensiveComputation" runs multiple times for the same input:
watch(expression, () => { ... });
watch(expression, () => { ... });
```

To avoid this, expressions can be wrapped using lazy:
```tsx
import { sig, watch, lazy } from "@mxjp/gluon";

const input = sig(0);

// "expensiveComputation" dosn't run immediately:
const expression = lazy(() => expensiveComputation(input.value));

// "expensiveComputation" runs only when any input was updated:
watch(expression, () => { ... });
watch(expression, () => { ... });
```

### Memos
The **memo** utility is similar to lazy expressions, but the wrapped expression is evaulated even if the output is not used.
```tsx
import { sig, watch, memo } from "@mxjp/gluon";

const input = sig(0);

// "expensiveComputation" runs once immediately:
const expression = memo(() => expensiveComputation(input.value));

// "expensiveComputation" runs only when any input was updated:
watch(expression, () => { ... });
watch(expression, () => { ... });
```

<br>



# Async Utilities

## Tasks
The task system in gluon keeps track of pending tasks in a specific context.
```tsx
import { mount, Inject } from "@mxjp/gluon";
import { isPending, waitFor } from "@mxjp/gluon/async";

mount(
  document.body,
  <Inject value={new Tasks()}>
    {() => <>
      <button
        disabled={isPending}
        $click={() => {
          waitFor(new Promise(resolve => {
            setTimeout(resolve, 1000);
          }));
        }}
      >Click me!</button>
    </>}
  </Inject>
);
```

## Async
Render content depending on an async function or promise.
```tsx
import { mount } from "@mxjp/gluon";
import { Async } from "@mxjp/gluon/async";

const promise = new Promise(resolve => setTimeout(resolve, 1000));

mount(
  document.body,
  <Async source={promise} pending={() => "Pending..."} rejected={error => `Rejected: ${error}`}>
    {value => <>Resolved: {value}</>}
  </Async>,
);
```

To use promises returned from an expression, this can be combined with [`<Show>`](#show):
```tsx
import { mount, When, sig } from "@mxjp/gluon";
import { Async } from "@mxjp/gluon/async";

const promise = sig(undefined);
setInterval(() => {
  promise.value = new Promise(resolve => setTimeout(resolve, 1000));
}, 3000);

mount(
  document.body,
  <When value={promise}>
    {promise => <Async source={promise} pending={() => "Pending..."} rejected={error => `Rejected: ${error}`}>
      {value => <>Resolved: {value}</>}
    </Async>}
  </When>
);
```

Async contexts can be used to wait for all async parts of a tree to complete:
```tsx
import { mount, Inject } from "@mxjp/gluon";
import { ASYNC, Async, AsyncContext } from "@mxjp/gluon/async";

// Create a new context with the current one as parent if there is one:
const context = AsyncContext.fork();

mount(
  document.body,
  <Inject key={ASYNC} value={context}>
    {() => <>
      <Async ... />
    </>}
  </Inject>
);

// Wait for all async parts to complete:
await context.complete();
```

## Abort Controllers
Abort controllers can be used in many web APIs to abort things.

The **useAbortController** and **useAbortSignal** functions can be used to abort things when the current context is disposed e.g. when content inside a `<When>` component is no longer rendered.
```tsx
import { useAbortSignal } from "@mxjp/gluon/async";

fetch("/info.txt", { signal: useAbortSignal() });

window.addEventListener("keydown", () => { ... }, { signal: useAbortSignal() });
```

<br>



# Routing
Routers provide a reactive path and query parameters and allow navigating in their current context.

Currently, there is a **HistoryRouter** that uses the location and history API and a **HashRouter** that uses the location hash as the path. You can also implement custom routers by implementing the **Router** interface.
```tsx
import { mount, Inject } from "@mxjp/gluon";
import { ROUTER, HistoryRouter } from "@mxjp/gluon/router";

mount(
  document.body,
  <Inject key={ROUTER} value={new HistoryRouter()}>
    {() => <>
      Everything in here has access to the history router.
    </>}
  </Inject>
);
```

The **Routes** component can be used to render content based on the current path.
```tsx
import { mount, Inject } from "@mxjp/gluon";
import { ROUTER, HistoryRouter, Routes } from "@mxjp/gluon/router";

mount(
  document.body,
  <Inject key={ROUTER} value={new HistoryRouter()}>
    {() => <>
      <Routes routes={[
        { match: "/", content: () => "Home" },
        { match: "/foo", content: ExamplePage },
        { content: () => "Not found" },
      ]} />
    </>}
  </Inject>
);

function ExamplePage() {
  return <>Example</>;
}
```

## Route Matching
Routes are matched against the [normalized](#path-normalization) path in the order in which they are specified.

Strings match exactly that path and all sub paths if they end with a slash:
```tsx
[
  // Matches only "/foo":
  { match: "/foo", ... },
  // Matches "/foo", "/foo/bar" etc.
  { match: "/foo/", ... },
]
```

Regular expressions are tested against the [normalized](#path-normalization) path:
```tsx
[
  // Matches only "/foo":
  { match: /^\/foo$/, ... },

  // Matches "/user/123":
  {
    match: /^\/user\/(\d+)$/,
    content: ({ params }) => {
      // The match is passed via the "params" property:
      return <>User id: {params[1]}</>;
    },
  },
]
```
Gluon itself doesn't provide any custom syntax for dynamic routes, but you can use a package like [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) if you need to:
```tsx
import { pathToRegexp } from "path-to-regexp";

[
  { match: pathToRegexp("/user/:id"), ... }
]
```

Functions can return an object with the normalized matched path and optional parameters to indicate a match:
```tsx
import { normalize } from "@mxjp/gluon/router";

[
  {
    match: path => {
      if (/\/foo(\/|$)/.test(path)) {
        return {
          path: normalize(path.slice(4)),
          params: 42,
        };
      }
    },
    content: ({ params }) => {
      return <>{params}</>;
    },
  }
]
```

## Path Normalization
Paths are normalized, so that non-empty paths always start with a slash and the root path is represented as an empty string.

## Navigation
The router in the current context can be used for navigation.

Routers implement a **push** function for regular navigation and a **replace** function for replacing the current path if possible.
```tsx
import { extract } from "@mxjp/gluon";
import { ROUTER } from "@mxjp/gluon/router";

function ExamplePage() {
  const router = extract(ROUTER).root;
  return <button $click={() => {
    router.push("/some-path");
  }}>Navigate</button>;
}
```
Note, that the router instance is replaced with a [child router](#nested-routing) inside of routed content. In this case, the **root** property always provides access to the history router from above.

## Nested Routing
Routes can be arbitrarily nested with content in between.

The example below renders text for the paths **/, /foo/bar, /foo/baz**
```tsx
import { mount, Inject, extract } from "@mxjp/gluon";
import { ROUTER, HistoryRouter, Routes } from "@mxjp/gluon/router";

mount(
  document.body,
  <Inject key={ROUTER} value={new HistoryRouter()}>
    {() => <>
      <Routes routes={[
        { match: "/", content: () => "Home" },
        { match: "/foo/", content: () => {
          const innerRouter = extract(ROUTER);
          return <Routes routes={[
            { match: "/bar", content: () => "Bar" },
            { match: "/baz", content: () => "Baz" },
          ]} />;
        } },
      ]} />
    </>}
  </Inject>
);
```
The router instance is replaced with a [child router](#nested-routing) inside of routed content which only exposes the unmatched rest path and navigates within the matched path. In the example above, the **innerRouter** navigates within **/foo**:
```tsx
// Navigates to /foo/bar:
innerRouter.push("/bar");

// To navigate globally, use the root router instead:
innerRouter.root.push("/foo/bar");
```

<br>



# Web Components
Gluon supports using web components just like any other native element.
```tsx
import { mount } from "@mxjp/gluon";

mount(
  document.body,
  <some-web-component />
);
```

To implement a web component, you can extend the **GluonElement** class which takes care of creating a shadow root and renders content when the element is connected to the document:
```tsx
import { GluonElement } from "@mxjp/gluon/element";

class ExampleComponent extends GluonElement {
  render() {
    return <h1>Hello World!</h1>;
  }
}

customElements.define("example-component", ExampleComponent);
```

## Reflecting Attributes
The **reflect** method can be used to get a signal that reflects an attribute value.
```tsx
import { GluonElement, attribute } from "@mxjp/gluon/element";

class ExampleCounter extends GluonElement {
  // Allow this component to detect changes to the "count" attribute:
  static observedAttributes = ["count"];

  // Create a signal that reflects the "count" attribute:
  #count = this.reflect("count");

  render() {
    return <button $click={() => {
      const newCount = Number(this.#count) + 1;

      // Updating the signal will also update the "count" attribute:
      this.#count.value = newCount;

      // Dispatch an event to notify users of your web component:
      this.dispatchEvent(new CustomEvent("count-changed", { detail: newCount }));
    }}>
      Clicked {this.#count} times!
    </button>;
  }

  // Optionally, you can implement property accessors:
  get count() {
    return Number(this.#count.value);
  }
  set count(value: number) {
    this.#count.value = String(value);
  }
}

customElements.define("example-counter", ExampleComponent);
```

## Manual Implementation
Due to it's simple lifecycle system, you can also implement web components manually:
```tsx
import { mount, capture, teardown, TeardownHook } from "@mxjp/gluon";

class ExampleComponent extends HTMLElement {
  #dispose: TeardownHook;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#dispose = capture(() => {
      // Create and append content to the shadow root:
      const view = mount(
        this.shadowRoot,
        <h1>Hello World!</h1>,
      );

      // Remove content from the shadow root when disposed:
      teardown(() => view.detach());
    });
  }

  disconnectedCallback() {
    // Run teardown hooks:
    this.#dispose?.();
    this.#dispose = undefined;
  }
}
```

<br>



# State Management
The state management API provides a way to create deep reactive wrappers for arbitrary objects.

The **wrap** function creates a deep reactive wrapper:
```tsx
import { mount } from "@mxjp/gluon";
import { wrap } from "@mxjp/gluon/store";

const state = wrap({
  message: "Hello World!",
});

mount(
  document.body,
  <h1>{() => state.message}</h1>
);
```

By default, **Arrays**, **Maps**, **Sets** and **Objects** without or with the `Object` constructor are reactive. Anything else is returned as is.

## Updates
To update a reactive object, you can directly modify the wrapper.
```tsx
const todos = wrap([
  { name: "Foo", done: false },
  { name: "Bar", done: false },
]);

todos[1].done = true;
todos.push({ name: "Baz", done: true });
```
Note, that every individual update is processed immediately. To prevent this, you can use [batches](#update-batching):
```tsx
import { batch } from "@mxjp/gluon";

batch(() => {
  todos[1].done = true;
  todos.push({ name: "Baz", done: true });
});
```

## Classes
By default, arbitrary class instances are not reactive unless you specify, how to wrap them:
```tsx
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
Private fields are not reactive. Also, you need to ensure they are accessed through the original object instead of reactive wrappers by using `unwrap(..)`.
```tsx
class Example {
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

<br>



# Troubleshooting
This section shows some common pitfalls and how to deal with them.

## Missing Context Values

### Context Key Typos
Ensure that the **key** argument is the same everywhere.
```tsx
inject("message", "Hello World!", () => {
  // There is a typo here:
  extract("nessage");
});
```

To avoid this, you can use [typed context keys](#typed-keys):
```tsx
const MESSAGE = Symbol.for("example-message") as ContextKey<string>;

inject(MESSAGE, "Hello World!", () => {
  // This typo is now a compiler error:
  extract(NESSAGE);
});
```

### Extract Running Too Late
**extract** must be called synchronously while the callback passed to **inject** or **deriveContext** is running.
```tsx
inject(MESSAGE, "Hello World!", () => {
  queueMicrotask(() => {
    // This runs after the inject call has already ended:
    extract(MESSAGE); // undefined
  });
});
```

To solve this, you can [forward the context](#context) as follows:
```tsx
inject(MESSAGE, "Hello World!", () => {

  // Bind the current context to your callback:
  queueMicrotask(wrapContext(() => {
    extract(MESSAGE); // "Hello World!"
  }));

  // Or manually pass the context to somewhere else:
  const context = getContext();
  queueMicrotask(() => {
    runInContext(context, () => {
      extract(MESSAGE); // "Hello World!"
    });
  });

});
```

### Extract Running Too Early
When using **deriveContext**, the context must be modified before **extract** is called.
```tsx
deriveContext(ctx => {
  // This doesn't work:
  extract(MESSAGE); // undefined

  ctx.set(MESSAGE, "Hello World!");

  // This works:
  extract(MESSAGE); // "Hello World!"
});
```

## Reactivity Not Working
For things to get updated or re-rendered, the following needs to be true:
+ The value in a signal must be replaced, or the signal must notify dependants using **notify** or **update**.
+ The place where the value is used must be able to access the signal by calling a function.

### Deep Updates
Signals don't automatically detect when values are deeply changed. They only detect when values are entirely replaced.
```tsx
const counter = sig({ count: 0 });
// This will not trigger any updates:
counter.value.count++;
```
When possible, you should wrap the inner values into signals:
```tsx
const counter = { count: sig(0) };
// Signals can also be deeply nested:
const counter = sig({ count: sig(0) });
```

When this isn't possible, you can use one of the following options:
```tsx
// Use the update function:
counter.update(value => {
  value.count++;
});

// Replace the entire value:
counter.value = { count: 1 };

// Manually notify dependants:
counter.value.count++;
counter.notify();
```

### Static Values
The value of signals or expressions can always be accessed in a non reactive ways:
```tsx
const count = sig(0);

// This isn't reactive:
mount(document.body, <>{count.value}</>);
mount(document.body, <>{get(count)}</>);
```
For signal accesses to be reactive, they need to be done in a function call:
```tsx
// This is now reactive:
mount(document.body, <>{() => count.value}</>);
mount(document.body, <>{() => get(count)}</>);

// Using the signal itself is also reactive:
mount(document.body, <>{count}</>);
```
This is also true for every other API that uses [expressions](#expressions). This way you always have the option to make something reactive or static.

### Strict Equality
By default, signals don't notify dependants after replacing the value if it's strictly equal to the previous one.
```tsx
const count = sig(0);
// This will not trigger any updates:
count.value = 0;
```
To force updates, you can use one of the following options:
```tsx
// Manually notify dependants:
count.notify();

// Disable the default equality check:
const count = sig(0, false);

// Use a custom equality check:
const count = sig(0, (previous, current) => false);
```

<br>



# Testing
Testing gluon based applications is usually very simple because all of it's signal based rendering is synchronous. E.g. when updating a signal, all resulting changes are reflected in the DOM immediately:
```tsx
const count = sig(7);
const element = <div>Current count: {count}</div> as HTMLDivElement;
assert(element.innerText === "Current count: 7");
count.value = 42;
assert(element.innerText === "Current count: 42");
```

## Synchronous Tests
Gluon provides a lightweight wrapper for running small synchronous tests that provides a [context](#context) and takes care of calling [teardown hooks](#lifecycle) after the test.
```tsx
import { runTest, querySelector } from "@mxjp/gluon/test";

runTest(ctx => {
  const count = sig(0);
  const view = mount(
    document.body,
    <button $click={() => { count.value++; }}>Click me!</button>,
  );
  querySelector(view, "button")?.click();
  assert(count.value === 1);
});
```

## Asynchronous Tests
Almost all gluon APIs rely on the synchronous call stack. E.g. extracting values from the current [context](#context) will not work after awaiting something:
```tsx
inject("foo", "bar", async () => {
  extract("foo"); // => "bar"
  await something();
  extract("foo"); // => undefined
});
```

There is a wrapper for async tests that allows you to run small synchronous parts of your test with a shared [context](#context), an [async context](#async). After the test, this will run [teardown hooks](#lifecycle) registered during **"use(..)"** calls and wait for any pending tasks tracked in the async context.

The example below shows a test that asserts that asynchronously loaded content is displayed correctly:
```tsx
import { runAsyncTest, querySelector } from "@mxjp/gluon/test";

await runAsyncTest(async ({ ctx, asyncCtx, use }) => {
  const view = use(() => {
    return mount(
      document.body,
      <Async source={async () => {
        await something();
        return "Hello World!";
      }}>
        {content => <div class="page">
          {content}
        </div>}
      </Async>
    );
  });

  // Wait for the "<Async>" component to resolve:
  await asyncCtx.complete();

  const page = querySelector<HTMLElement>(view, ".page");
  assert(page !== null);
  assert(page.innerText === "Hello World!");
});
```

## Waiting For Expressions
You can watch arbitrary [expressions](#expressions) using the **watchFor** function.
```tsx
import { sig, watchFor, isPending } from "@mxjp/gluon";

// Wait for a specific signal value:
const count = sig(0);
doSomethingAsyncWithCount();
await watchFor(() => count.value > 7);

// Wait with a timeout:
await watchFor(() => count.value > 7, 500);

// Wait for pending user tasks:
await watchFor(() => !isPending());
```

## Leak Detection
The [lifecycle API](#lifecycle) silently discards teardown hooks outside of **capture** calls. This can be a valid use case, for instance when rendering your application until the browser closes or when intentionally leaking teardown hooks using **uncapture**.

However, this can result in accidental memory leaks when registering teardown hooks in async code:
```tsx
const stop = capture(async () => {
  await something();
  const interval = setInterval(() => console.log("ping!"), 1000);
  // "clearInterval" will never be called:
  teardown(() => clearInterval(interval));
});

stop();
```

To catch these cases, you can use the **onTeardownLeak** function once before running all of your tests:
```tsx
import { onTeardownLeak } from "@mxjp/gluon/test";

onTeardownLeak(hook => {
  // "hook" is the teardown hook that is being registered.
  console.trace("Leaked teardown hook:", hook);

  // Or throw an error from within the **teardown** call:
  throw new Error("Teardown hook was not captured.");
});

// This will now call the code above:
teardown(() => {});

// This will NOT call the code above, as using **uncapture** is very likely intentional:
uncapture(() => teardown(() => {}));
```

## Concurrency
It is generally possible to run tests for gluon based applications concurrently. However, using APIs that may interfere with each other such as **Element.focus** can result in flaky tests. To solve this you can use the **exclusive** function to run code in a globally shared queue for a specific purpose:
```tsx
import { runAsyncTest, exclusive } from "@mxjp/gluon/test";

const FOCUS_ACTIONS = Symbol("focus actions");

await exclusive(FOCUS_ACTIONS, async () => {
  someInput.focus();
  await somethingElse();
  assert(document.activeElement === someInput);
});
```
Using symbols as keys that are in some common place in your test setup is recommended as it prevents any typos in the key, but you can also use anything alse that can be a **Map** key.

<br>



# Shared Globals & Compatibility
Gluon's signal, context and lifecycle APIs are based on globals and the synchronous call stack.

**Example:** To capture lifecycle teardown hooks, the capture function pushes a new array onto a global stack and then runs a synchronous function which may add teardown hooks to that array. After this the array is removed from the stack and will contain all the registered teardown hooks which can be called later.

From **gluon v5.2** and upwards, these globals are shared between different versions of gluon that run on the same thread. Additionally, the instanceof operator will also work with **View** and **Signal** instances from other versions.

This makes it possible to use newer versions of gluon without being forced to update dependencies. For instance, when using gluon v6, you could still use a UI library based on gluon v5.2 just fine.

<br>



# Security
As with any other rendering library, there are several ways to introduce severe security vulnerabilities into a gluon based application by directly allowing user input in specific places.

Assuming that **userInput** is arbitrary user input, the examples below can lead to **severe security vulnerabilities**:
```tsx
// The "prop:innerHTML" attribute can be used to directly render HTML:
<div prop:innerHTML={userInput} />;
<div prop:innerHTML={"<script>alert(location.origin)</script>"} />;

// Any native event attributes can be used to run javascript when dispatched:
<div onclick={userInput} />;
<div onclick="alert(location.origin)" />;

// Because of the above, user controlled attribute names are at least problematic:
<div {...{ [userInput]: somethingElse }} />;
<div {...{ ["prop:innerHTML"]: "<script>alert(location.origin)</script>" }} />;
```
In summary, you should **never** use arbitrary user input as:
+ **prop:innerHTML** attribute value
+ **on...** attribute value
+ attribute name

In contrast, user input used in other attributes and as content is perfectly fine as shown in the example below:
```tsx
import { mount } from "@mxjp/gluon";

mount(
  document.body,
  <div title="alert(location.origin)">
    {"<script>alert(location.origin)</script>"}
  </div>
);
```
