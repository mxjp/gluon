---
title: Overview
---

![](./assets/banner.svg)

# Gluon
This is a signal based frontend framework.

```jsx
import { mount, sig } from "@mxjp/gluon";

const count = sig(0);

mount(
  document.body,
  <button $click={() => { count.value++ }}>
    Clicked {count} times
  </button>
);
```

## Concept

### Low Level
JSX expressions in gluon directly create real DOM elements which is relatively fast and has a low memory footprint compared to virtual DOMs. For rendering conditional or repeated nodes, gluon uses so called Views which are just sequences of nodes that notify their owner of any boundary updates.

### Composability
Everything in gluon is composable without any restrictions. You can define reactive state anywhere you like and use it anywhere else, dynamically define and pass around components, etc.

### Bundle Size
The entire gluon core module has a size of [~4KB gzipped](https://bundlephobia.com/package/@mxjp/gluon) and almost everything in gluon is tree-shakeable, so you only pay for what you need.

### Build Setup
Gluon only requires a standard JSX transpiler and therefore works with all modern bundlers and build systems. There also is a human readable pre-bundled version for use in environments where no build system can be used.

### Strongly Typed Reactivity
When using gluon with TypeScript, the fact which component properties may be reactive is [encoded in the type system](reference/core/components.md#expressions). This allows developers to know what to expect of a component and eliminates weird caveats when accessing properties from a component's props argument.

### Immediate Updates
Signal updates are processed immediately. This results in more predictable behavior and makes your application easy to test. If needed, you can still use batching to process multiple updates in one instant.

### Low Maintenance Costs
The core principles of gluon will never change and it's guaranteed that new major versions are [interoperable with older ones](reference/core/globals.md) to allow you to update dependencies when you have time to do so. For instance, using a UI component library based on gluon v6 will still work just fine with the most recent version including reactivity, lifecycle hooks etc.

## Features
Gluon supports all the client side features you would expect from a modern framework including:

+ Rendering SVG & MathML elements
+ Manually watching for state changes
+ Lazy & memoized computations
+ Two way data binding via mapped signals
+ Portaling elements
+ Conditional rendering
+ Custom rendering logic
+ Lifecycle hooks
+ Components
+ Contexts
+ Update batching
+ Using and authoring web components
+ Global state management with deep reactive wrappers for
  + Arrays
  + Objects & class instances
  + Sets
  + Maps
+ History API & hash based routing
  + Custom & manual route matching
  + Nested routing

### SSR & Hydration
Gluon does not directly support server side rendering (SSR) or hydration. Instead, you can use libraries like [JSDOM](https://www.npmjs.com/package/jsdom) to render gluon applications on the server or during the build process.

On the client, gluon provides a way to render an entire application in the background, wait for all async parts to complete and then replace pre-rendered DOM. This approach temporarily uses more memory than hydration, but has approximately the same performance, makes client side code much more simpler and removes the need to explicitly support SSR and hydration in your application code.
