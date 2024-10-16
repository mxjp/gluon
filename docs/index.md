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
	<button on:click={() => { count.value++ }}>
		Clicked {count} times
	</button>
);
```

## Concept

### Low Level
In gluon, you directly create real DOM elements which is relatively fast and has a low memory footprint compared to virtual DOMs. For rendering conditional or repeated nodes, gluon uses so called Views which are just sequences of nodes that can change themselves over time.

### Composability
Everything in gluon is composable without any restrictions. You can define reactive state anywhere you like and use it anywhere else, dynamically define and pass around components, etc.

### No/Minimal Build System
Gluon doesn't require a build system. You can choose between an element builder API, any standard JSX transpiler or both if you need to.

### Bundle Size
The entire gluon core module has a size of [~4KB gzipped](https://bundlephobia.com/package/@mxjp/gluon) and almost everything in gluon is tree-shakeable, so you only pay for what you need.

### Strongly Typed Reactivity
When using gluon with TypeScript, the fact which component properties may be reactive is [encoded in the type system](./reference/components.md#expressions). This allows developers to know what to expect of a component and eliminates weird caveats when accessing properties from a component's props argument.

### Immediate Updates
Signal updates are always processed immediately. This ensures that your application state stays consistent & predictable at any time.

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

### Hydration Unsupport
Gluon does not directly support server side rendering (SSR) or hydration and probably never will. Instead, you can use libraries like [JSDOM](https://www.npmjs.com/package/jsdom) to render gluon applications on the server or during the build process.

On the client, gluon provides a way to [render](./examples/render-to-string.md) an entire application in the background, wait for all async parts to complete and then replace pre-rendered DOM. This approach temporarily uses more memory than hydration, but has approximately the same performance, makes client side code much more simpler and removes the need to explicitly support SSR and hydration in your application code.
