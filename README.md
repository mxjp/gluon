![gluon banner](./assets/banner.svg)

# gluon!
This is a tiny signal based rendering library that aims to be usable with widely adopted or even without any build systems to avoid maintenance overhead for long living projects.

## Documentation
+ [Installation](#installation)
  + [JSX Setup](#jsx-setup)
  + [Basic Usage](#basic-usage)
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
  + [Stylesheets](#stylesheets)
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
Expressions (static values, signals and functions) are rendered as text content.
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

#### `when`
The **when** function creates a view that renders conditional content or optional fallback content.

Note, that content is recreated if the expression result is not strictly equal to the last one. To keep content alive when the condition is falsy, use [show](#show) instead.
```tsx
import { mount, when, sig } from "@mxjp/gluon";

const message = sig(null);

mount(
  document.body,
  <div>
    {when(message, message => {
      return <h1>{message}</h1>;
    }, () => {
      return "No message to render.";
    })}
  </div>,
);
```

#### `nest`
The **nest** function renders content using a function returned from an expression.

Note, that content is recreated every time the expression is rerun.

For simple conditional content, prefer using [when](#when).
```tsx
import { mount, nest, sig } from "@mxjp/gluon";

const message = sig({
  type: "foo",
  text: "Hello World!",
});

mount(
  document.body,
  <div>
    {nest(() => {
      const current = message.value;
      switch (current.type) {
        case "foo": return () => (<h1>{current.text}</h1>);
        case "bar": ...;
        case "baz": ...;
      }
    })}
  </div>,
);
```

#### `map`
The **map** function creates a view that renders content for each unique value in an iterable.

Items are rendered in iteration order and duplicates are silently ignored.

The **index** parameter is a function that can be used to reactively get the current index.
```tsx
import { mount, map, sig } from "@mxjp/gluon";

const items = sig(["foo", "bar", "bar", "baz"]);

mount(
  document.body,
  <ul>
    {map(items, (value, index) => {
      return <li>
        {() => index() + 1}: {value}
      </li>;
    })}
  </ul>
);
```

#### `iter`
The **iter** function creates a view that renders content for each index in an iterable.

Items are rendered in iteration order.
```tsx
import { mount, iter, sig } from "@mxjp/gluon";

const items = sig(["foo", "bar", "bar", "baz"]);

mount(
  document.body,
  <ul>
    {iter(items, (value, index) => {
      return <li>
        {index + 1}: {value}
      </li>;
    })}
  </ul>
);
```

#### `show`
The **show** function creates a view that shows rendered content if an expression is truthy.

Note, that content is not disposed when hidden. To conditionally render content, use [when](#when) or [nest](#nest) instead.

```tsx
import { mount, show, sig } from "@mxjp/gluon";

const showMessage = sig(false);

mount(
  document.body,
  <div>
    {show(showMessage, "Hello World!")}
  </div>
);
```

#### `movable`
The **movable** function renders content, so that it can be safely moved to new places.

Note, that content is detached from it's previous place when moved.
```tsx
import { mount, movable } from "@mxjp/gluon";

const content = movable("Hello World!");

mount(
  document.body,
  <div>
    {content.move()}
  </div>
);

// Move "content" into a new place:
mount(
  document.body,
  <div>
    {content.move()}
  </div>
);

// Detach "content" from it's previous place:
content.detach();
```

### Hidden Content
The values **null** and **undefined** are not rendered. However an HTML comment is created so that views without any content are able to keep track of their position and boundary in the DOM tree.
```tsx
import { mount } from "@mxjp/gluon";

mount(
  document.body,
  <div>
    {null}
    {undefined}
    {() => null}
    ...
  </div>,
);
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
import { mount, useNamespace, SVG } from "@mxjp/gluon";

mount(
  document.body,
  <div>
    {useNamespace(SVG, () => {
      return <svg version="1.1" viewBox="0 0 100 100">...</svg>;
    })}
  </div>,
);
```

## Components
Gluon has no special component system. Instead components are just functions that return content and take arbitrary inputs, but can still use [lifecycle hooks](#lifecycle).
```tsx
import { mount, Signal } from "@mxjp/gluon";

function textInput(text: Signal<string>) {
  return <input
    type="text"
    value={text}
    $input={event => {
      text.value = event.target.value;
    }}
  />;
}

const text = sig("");
mount(
  document.body,
  <>
    {textInput(text)}
    You typed <b>{text}</b>.
  </>,
);
```

To accept both static and reactive inputs, the **get** function can be used to evaluate expressions.
```tsx
import { mount, get, stylesheet, Expression } from "@mxjp/gluon";

const [classes] = stylesheet(`
  .error { color: red; }
  .info { color: blue; }
`);

function hint(variant: Expression<"error" | "info">, content: unknown) {
  return <div class={() => classes[get(variant)]}>
    {content}
  </div>;
}

mount(
  document.body,
  <>
    {hint("error", "Hello World!")}
    {hint(() => "info", "Hello World!")}
    {hint(someSignal, "Hello World!")}
  </>,
);
```

## Stylesheets
The **stylesheet** function can be used to create a global stylesheet with unique class names.
```tsx
import { stylesheet } from "@mxjp/gluon";

const [classes] = stylesheet(`
  .example {
    color: red;
  }
`);

mount(
  document.body,
  <div class={classes.example}>Hello World!</div>,
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
Gluon itself does not provide any method of rendering HTML directly and is therefore safe from XSS vulnerabilities unless you manually render HTML or set the **innerHTML** property.
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
