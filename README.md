![gluon banner](./assets/banner.svg)

# gluon!
This is a tiny signal based rendering library that aims to be usable with widely adopted or even without any build systems to avoid maintenance overhead for long living projects.

> ## Why?
> [SolidJS](https://www.solidjs.com/) is a great framework which I used for many personal projects. However it's core reactivity primitives are designed in a way that sometimes requires weird workarounds for problems that shouldn't exist in the first place. For instance, gluon uses a lightweight stack based approach for tracking dependencies in contrast to solidjs reactivity scope owners.
>
> In gluon, there are two basic reactivity primitives: **Signals** and **watch**. Watch is similar to solidjs' **createEffect**, but it's inputs are split into an expression with dependancy tracking and a callback without tracking which makes avoiding infinite loops and unexpectedly tracked signal accesses a lot easier.

## Documentation
+ [Installation](#installation)
  + [JSX Setup](#jsx-setup)
  + [Basic Usage](#basic-usage)
  + [Examples](#examples)
+ [Reactivity](#reactivity)
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
+ [Lifecycle](#lifecycle)
+ [Context](#context)
+ [Performance](#performance)
  + [Update Batching](#update-batching)
  + [Lazy Expressions](#lazy-expressions)
+ [Web Components](#web-components)
+ [Security](#security)

<br>



# Installation
Gluon is available as an [npm package](https://www.npmjs.com/package/@mxjp/gluon).
```bash
npm i @mxjp/gluon
```
Alternatively, you can copy the [human readable](https://www.unpkg.com/@mxjp/gluon/dist/gluon.js) or the [minified](https://www.unpkg.com/@mxjp/gluon/dist/gluon.min.js) es module bundle directly into your project.

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



# Reactivity
Reactivity in gluon is entirely based on signals and expressions.

**Signals** represent values that change over time and keep track of their dependants.

**Expressions** can be static values, signals or functions that re-run when any accessed signal is updated. Expressions can be watched manually or used as attributes and element content to render text.

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
```

<br>



# Rendering
JSX expressions and the **e** function create elements directly.
```tsx
import { e } from "@mxjp/gluon";

<div /> instanceof HTMLDivElement; // true

e("div") instanceof HTMLDivElement; // true
```

## Attributes
Attributes are set using writable properties if possible and **setAttribute** otherwise.
```tsx
import { mount, e } from "@mxjp/gluon";

mount(
  document.body,
  <div
    title="This is set using the title property."
    something-else="This is set using setAttribute."
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
The **class** attribute can be an object with expressions that determine if a class is added or removed from the element class list.
```tsx
import { mount } from "@mxjp/gluon";

mount(
  document.body,
  <div class={{
    foo: true,
    bar: someSignal,
    baz: () => someSignal.value,
  }} />,
);
```

### Styles
The **style** attribute can be an object with expressions:
```tsx
import { mount } from "@mxjp/gluon";

mount(
  document.body,
  <div style={{
    color: "red",
    width: someSignal,
    height: () => `${someOtherSignal.value}px`,
  }} />,
);
```

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

For every view type, there also is a "component" for use with JSX. All the view examples below show both versions.

#### `<When>`
Render conditional content or optional fallback content.

Note, that content is recreated if the expression result is not strictly equal to the last one. To keep content alive when the condition is falsy, use [show](#show) instead.
```tsx
import { mount, when, When, sig } from "@mxjp/gluon";

const message = sig(null);

mount(
  document.body,
  <>
    {when(message, message => <>
      <h1>{message}</h1>
    </>, () => <>
      No message to render.
    </>)}

    <When value={message} else={() => <>No message to render.</>}>
      {message => <h1>{message}</h1>}
    </When>
  </>,
);
```

#### `<Nest>`
Render content using a function returned from an expression.

Note, that content is recreated every time the expression is rerun.

For simple conditional content, prefer using [when](#when).
```tsx
import { mount, nest, Nest, sig } from "@mxjp/gluon";

const message = sig({
  type: "foo",
  text: "Hello World!",
});

mount(
  document.body,
  <>
    {nest(() => {
      const current = message.value;
      switch (current.type) {
        case "foo": return () => (<h1>{current.text}</h1>);
        case "bar": ...;
      }
    })}

    <Nest>
      {() => {
        const current = message.value;
        switch (current.type) {
          case "foo": return () => (<h1>{current.text}</h1>);
          case "bar": ...;
        }
      }}
    </Nest>
  </>,
);
```

#### `<Map>`
Render content for each unique value in an iterable.

Items are rendered in iteration order and duplicates are silently ignored.

The **index** parameter is a function that can be used to reactively get the current index.
```tsx
import { mount, map, Map, sig } from "@mxjp/gluon";

const items = sig(["foo", "bar", "bar", "baz"]);

mount(
  document.body,
  <ul>
    {map(items, (value, index) => <>
      <li>{() => index() + 1}: {value}</li>;
    </>)}

    <Map each={items}>
      {(value, index) => <li>{() => index() + 1}: {value}</li>}
    </Map>
  </ul>
);
```

#### `iter`
The **iter** function creates a view that renders content for each index in an iterable.

Items are rendered in iteration order.
```tsx
import { mount, iter, Iter, sig } from "@mxjp/gluon";

const items = sig(["foo", "bar", "bar", "baz"]);

mount(
  document.body,
  <ul>
    {iter(items, (value, index) => <>
      <li>{index + 1}: {value}</li>
    </>)}

    <Iter each={items}>
      {(value, index) => <li>{index + 1}: {value}</li>}
    </Iter>
  </ul>
);
```

#### `show`
The **show** function creates a view that shows rendered content if an expression is truthy.

Note, that content is not disposed when hidden. To conditionally render content, use [when](#when) or [nest](#nest) instead.

```tsx
import { mount, show, Show, sig } from "@mxjp/gluon";

const showMessage = sig(false);

mount(
  document.body,
  <>
    {show(showMessage, <>Hello World!</>)}

    <Show when={showMessage}>
      Hello World!
    </Show>
  </>
);
```

#### `movable`
The **movable** function renders content, so that it can be safely moved to new places.

Note, that content is detached from it's previous place when moved.
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
Content can also consist of arbitrarily nested jsx fragments and arrays.
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
typeof (<>Hello World!</>); // => string
Array.isArray(<>foo{42}</>); // => true
```

## Namespaces
By default, elements are created as HTML elements. This works fine for most cases, but requires some extra work to create **SVG** or **MathML** elements.

The namespace URI for new elements can be set via [contexts](#context).
```tsx
import { mount, useNamespace, UseNamespace, SVG } from "@mxjp/gluon";

mount(
  document.body,
  <div>
    {useNamespace(SVG, () => {
      return <svg version="1.1" viewBox="0 0 100 100">...</svg>;
    })}

    <UseNamespace uri={SVG}>
      {() => <svg version="1.1" viewBox="0 0 100 100">...</svg>}
    </UseNamespace>
  </div>,
);
```

## Components
Gluon has no special component system. Instead components are just functions that return content and take arbitrary inputs. When used with JSX syntax, functions are called with the properties object as the first parameter.
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

To accept both static and reactive inputs, the **get** function can be used to evaluate expressions.
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
import { mount, sig, map } from "@mxjp/gluon";

const items = sig(["foo", "bar", "baz"]);

mount(
  document.body,
  map(items, value => {
    console.log("Rendering:", value);
    teardown(() => {
      console.log("Removing:", value);
    });
    return <li>{value}</li>;
  }),
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
import { mount, when, inject, extract } from "@mxjp/gluon";

mount(
  document.body,
  inject(["message", "Hello World!"], () => {
    return when(someSignal, () => {
      return <h1>{extract("message")}</h1>;
    });
  }),
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

const expression = lazy(() => expensiveComputation(input.value));

// "expensiveComputation" runs only when any input was updated:
watch(expression, () => { ... });
watch(expression, () => { ... });
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
Gluon itself does not provide any method of rendering HTML directly and is therefore safe from XSS vulnerabilities unless you manually render HTML or set the **innerHTML** property. This also means that any external input should never be used as attribute name.

```tsx
import { mount } from "@mxjp/gluon";

const dangerous = "<script>alert(location.origin)</script>";

// This is always safe:
mount(
  document.body,
  <div>
    {dangerous}
  </div>,
);

// To unsafely render HTML, this would be needed:
mount(
  document.body,
  <div innerHTML={dangerous} />,
);
```
