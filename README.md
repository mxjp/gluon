![gluon banner](./assets/banner.svg)

# gluon!
This is a tiny signal based rendering library that aims to be usable with widely adopted build systems to avoid maintenance overhead for long living projects.

## Documentation
+ [Installation](#installation)
  + [JSX Setup](#jsx-setup)
  + [Basic Usage](#basic-usage)
  + [Examples](#examples)
+ [Rendering](#rendering)
  + [Attributes](#attributes)
    + [Classes](#classes)
    + [Styles](#styles)
    + [Events](#events)
  + [Content](#content)
    + [Text](#text)
    + [Nodes](#nodes)
    + [Views](#views)
      + [when](#when)
      + [nest](#nest)
      + [map](#map)
      + [iter](#iter)
      + [show](#show)
      + [movable](#movable)
    + [Hidden Content](#hidden-content)
    + [Fragments & Arrays](#fragments--arrays)
  + [Namespaces](#namespaces)
  + [Components](#components)
+ [Reactivity](#reactivity)
  + [Signals](#signals)
  + [Expressions](#expressions)
  + [Conversion](#conversion)
+ [Lifecycle](#lifecycle)
+ [Context](#context)
+ [Performance](#performance)
  + [Update Batching](#update-batching)
  + [Lazy Expressions](#lazy-expressions)
    + [Memos](#memos)
+ [Async Utilities](#async-utilities)
  + [Tasks](#tasks)
  + [Unwrap](#unwrap)
  + [Abort Controllers](#abort-controllers)
+ [Routing](#routing)
  + [Navigation](#navigation)
  + [Route Matching](#route-matching)
  + [Nested Routing](#nested-routing)
+ [Web Components](#web-components)
+ [Security](#security)

<br>



# Installation
Gluon is available as an [npm package](https://www.npmjs.com/package/@mxjp/gluon).
```bash
npm i @mxjp/gluon
```

## JSX Setup
Gluon's npm package supports jsx without any special transform and can be used in typescript by adding the two options below:
```js
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@mxjp/gluon"
  }
}
```

## Bundles
Alternatively, you can copy the bundles below directly into your project for use without any build system.

| Modules | Human Readable | Minified | Types |
|-|-|-|-|
| Core | [gluon.js](https://unpkg.com/@mxjp/gluon/dist/gluon.js) | [gluon.min.js](https://unpkg.com/@mxjp/gluon/dist/gluon.min.js) | [gluon.d.ts](https://unpkg.com/@mxjp/gluon/dist/gluon.d.ts) |
| Core, Async, Router | [gluon.all.js](https://unpkg.com/@mxjp/gluon/dist/gluon.all.js) | [gluon.all.min.js](https://unpkg.com/@mxjp/gluon/dist/gluon.all.min.js) | [gluon.all.d.ts](https://unpkg.com/@mxjp/gluon/dist/gluon.all.d.ts) |

Note, that the bundles above do not include the JSX runtime and any JSX related components.

## Basic Usage
The **mount** function renders any supported content and appends it to an element.
```tsx
import { mount, e } from "@mxjp/gluon";

// Using jsx:
mount(document.body, <h1>Hello World!</h1>);

// Or without jsx:
mount(document.body, e("h1", ["Hello World!"]));
```

## Examples
There are a bunch of examples in the repositories [examples](./examples/) directory.<br>
You can also [view them in your browser](https://mxjp.github.io/gluon/).

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
Any DOM nodes (except document fragments) are used as is.
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

### Views
Views are sequences of one or more nodes that change over time. They can be used to render collections or conditional content.

For every view listed below, there is a lower cased variant for use without jsx.

#### `<When>`
Render conditional content or optional fallback content.

Note, that content is recreated if the expression result is not strictly equal to the last one. To keep content alive when the condition is falsy, use [show](#show) instead.
```tsx
import { mount, When, sig } from "@mxjp/gluon";

const message = sig(null);

mount(
  document.body,
  <When value={message} else={() => <>No message to render.</>}>
    {message => <h1>{message}</h1>}
  </When>
);
```

#### `<Nest>`
Render a [component](#components) returned from an expression.

Note, that content is recreated every time the expression is rerun.

For simple conditional content, prefer using [when](#when).
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

#### `<Map>`
Render content for each unique value in an iterable.

Items are rendered in iteration order and duplicates are silently ignored.

The **index** parameter is a function that can be used to reactively get the current index.
```tsx
import { mount, Map, sig } from "@mxjp/gluon";

const items = sig(["foo", "bar", "bar", "baz"]);

mount(
  document.body,
  <ul>
    <Map each={items}>
      {(value, index) => <li>{() => index() + 1}: {value}</li>}
    </Map>
  </ul>
);
```

#### `<Iter>`
Render content for each index / item pair in an iterable.

Items are rendered in iteration order.
```tsx
import { mount, Iter, sig } from "@mxjp/gluon";

const items = sig(["foo", "bar", "bar", "baz"]);

mount(
  document.body,
  <ul>
    <Iter each={items}>
      {(value, index) => <li>{index + 1}: {value}</li>}
    </Iter>
  </ul>
);
```

#### `<Show>`
Attach content if an expression is truthy.

To conditionally render content, use [when](#when) or [nest](#nest) instead.

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

#### `movable`
The **movable** function wraps content, so that it can be safely moved to new places.

When moved, content is safely detached from it's previous parent.
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

Note, that jsx fragments in gluon return their children as is.
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
In gluon, components are simple functions that return content and take arbitrary inputs. When used with JSX syntax, props are passed as the first argument.
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

By default, properties are non-reactive. To accept reactive properties, you can use [expressions](#reactivity) and the **get** function to evaluate them when needed:
```tsx
import { mount, get, Expression } from "@mxjp/gluon";

import classes from "./example.module.css";

function Hint(props: {
  variant: Expression<"error" | "info">,
  children: unknown,
}) {
  return <div class={() => classes[get(props.variant)]}>
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

## Conversion
Sometimes it can be useful to convert user inputs in some way, e.g. trimming whitespace or parsing a number.

The example below shows how signals can be converted while allowing data flow in both directions. Things like the **trim** function below are easy to reuse and compose with other behaviors.
```tsx
import { sig, Signal, watch, mount } from "@mxjp/gluon";

export function trim(source: Signal<string>): Signal<string> {
  const input = sig(source.value);

  // Write the trimmed value back into source when the input is updated:
  watch(input, value => {
    source.value = value.trim();
  }, true);

  // Write the source value into the input if it doesn't match the trimmed input:
  watch(source, value => {
    if (value !== input.value.trim()) {
      input.value = value;
    }
  }, true);

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
import { mount, sig, Map, teardown } from "@mxjp/gluon";

const items = sig(["foo", "bar", "baz"]);

mount(
  document.body,
  <Map each={items}>
    {item => {
      console.log("Rendering:", item);
      teardown(() => {
        console.log("Removing:", item);
      });
      return <li>{item}</li>;
    }}
  </Map>
);
```

<br>



# Context
Contexts can be used to pass key-value pairs along the call stack without requiring intermediaries to know about them.
```tsx
import { inject, extract } from "@mxjp/gluon";

// Inject a key-value pair:
inject(["message", "Hello World!"], () => {
  // Extract a value by key:
  console.log("Message:", extract("message"));
});

class Example {}

// Inject a class instance:
inject(new Example(), () => {
  // Extract an instance by it's constructor:
  extract(Example) instanceof Example; // true
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
To make contexts work with other asynchronous code, you can manually run functions in a different context:
```tsx
import { inject, getContext, runInContext } from "@mxjp/gluon";

inject(["message", "Hello World!"], () => {
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
import { mount, Inject, Tasks, isPending, waitFor } from "@mxjp/gluon";

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

## Unwrap
Render content depending on an async function or promise.
```tsx
import { mount, Unwrap } from "@mxjp/gluon";

const promise = new Promise(resolve => setTimeout(resolve, 1000));

mount(
  document.body,
  <Unwrap source={promise} pending={() => "Pending..."} rejected={error => `Rejected: ${error}`}>
    {value => <>Resolved: {value}</>}
  </Unwrap>,
);
```

To unwrap promises returned from an expression, unwrap can be combined with [when](#when).
```tsx
import { mount, Unwrap, When, sig } from "@mxjp/gluon";

const promise = sig(undefined);
setInterval(() => {
  promise.value = new Promise(resolve => setTimeout(resolve, 1000));
}, 3000);

mount(
  document.body,
  <When value={promise}>
    {promise => <Unwrap source={promise} pending={() => "Pending..."} rejected={error => `Rejected: ${error}`}>
      {value => <>Resolved: {value}</>}
    </Unwrap>}
  </When>
);
```

## Abort Controllers
Abort controllers can be used in many web APIs to abort things.

The **useAbortController** and **useAbortSignal** functions can be used to abort things when the current context is disposed e.g. when content inside a `<When>` component is no longer rendered.
```tsx
import { useAbortSignal } from "@mxjp/gluon";

fetch("/info.txt", { signal: useAbortSignal() });

window.addEventListener("keydown", () => { ... }, { signal: useAbortSignal() });
```

<br>



# Routing
Routers provide a reactive path and query parameters and allow navigating in their current context.

Currently, there is a **HistoryRouter** that uses the location and history API and a **HashRouter** that uses the location hash as the path. You can also implement custom routers by implementing the **Router** interface.
```tsx
import { mount, Inject, HistoryRouter } from "@mxjp/gluon";

mount(
  document.body,
  <Inject key={ROUTER} value={new HistoryRouter()}>
    {() => <>
      Everything in here has access to the history router.
    </>}
  </Inject>
);
```

The **routes** function or **Routes** component can be used to render content based on the current path.
```tsx
import { mount, UseRouter, HistoryRouter, ROUTER, Routes } from "@mxjp/gluon";

mount(
  document.body,
  <Inject key={ROUTER} value={new HistoryRouter()}>
    {() => <>
      <Routes routes={[
        { path: "/", content: () => "Home" },
        { path: "/foo", content: ExamplePage },
        { content: () => "Not found" },
      ]} />
    </>}
  </Inject>
);

function ExamplePage() {
  return <>Example</>;
}
```

## Navigation
The router in the current context can be used for navigation.

Routers implement a **push** function for regular navigation and a **replace** function for replacing the current path if possible.
```tsx
function ExamplePage() {
  const router = extract(ROUTER).root;
  return <button $click={() => {
    router.push("/some-path");
  }}>Navigate</button>;
}
```
Note, that the router instance is replaced with a [child router](#nested-routing) inside of routed content. In this case, the **root** property provides access to the history router from above.

## Route Matching
When matching against a path, routes are tested in order. Route paths can be any of the following:
+ Strings with a trailing slash match that path and all sub paths.
+ Strings without traling slash match exactly that path.
+ Functions may return the path that was matched or a tuple with the matched path and extracted parameters to indicate a match.
+ For regular expressions, the match array is provided as parameters.
+ Routes without path match always.

Route parameters are passed to the content functions or components. The example below renders an ID extracted from paths like **/books/42**:
```tsx
import { mount, UseRouter, HistoryRouter, Routes } from "@mxjp/gluon";

function Example(props) {
  return `ID: ${props.params[1]}`;
}

mount(
  document.body,
  <Inject key={ROUTER} value={new HistoryRouter()}>
    {() => <>
      <Routes routes={[
        { path: /^\/books\/(\d+)(?:\/|$)/, content: Example },
      ]} />
    </>}
  </Inject>
);
```

## Nested Routing
Routes can be arbitrarily nested with content in between.

The example below renders text for the paths **/, /foo/bar, /foo/baz**
```tsx
import { mount, UseRouter, HistoryRouter, Routes } from "@mxjp/gluon";

mount(
  document.body,
  <Inject key={ROUTER} value={new HistoryRouter()}>
    {() => <>
      <Routes routes={[
        { path: "/", content: () => "Home" },
        { path: "/foo/", content: () => {
          const innerRouter = extract(ROUTER);
          return <Routes routes={[
            { path: "/bar", content: () => "Bar" },
            { path: "/baz", content: () => "Baz" },
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
Due to it's simple lifecycle system, gluon can be used to implement web components without any additional libraries.

The example below shows a minimal web component that is initialized when connected to the tree and disposed when disconnected from the tree.
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
