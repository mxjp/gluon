# Views
Views are an abstraction for sequences of DOM nodes that may change over time. To keep track of their position they contain at least one node which may be a comment node if there is nothing to render.

Views can be used as [element content](../elements.md#content) or can be returned from [component functions](../components.md).

## Creating Views
Gluon provides the following components for common use cases:

+ [`<Show>`](show.md) - Render content if a condition is met.
+ [`<Attach>`](attach.md) -  Attach already rendered content if a condition is met.
+ [`<Nest>`](nest.md) - Render a component returned from an expression.
+ [`<For>`](for.md) - Render content for each unique value in an iterable.
+ [`<IndexFor>`](index-for.md) - Render content for each index in an iterable.
+ [`movable`](movable.md) - Wrap content for safely moving it somewhere else.

You can also directly create views from arbitrary [content](../elements.md#content) using the `render` and `mount` functions:
```jsx
import { render } from "@mxjp/gluon";

const view = render(<>Hello World!</>);

```
The `mount` function creates a view and appends it to an element until the current [lifecycle](../lifecycle.md) is disposed:
```jsx
import { mount } from "@mxjp/gluon";

const view = mount(document.body, <>Hello World!</>);
```

## View API
As a consumer of the view API, you need to guarantee that:

+ The sequence of nodes is not modified from the outside.
+ If there are multiple nodes, all nodes must have a common parent node at all time.

The current boundary can be access via the `first` and `last` properties.
```jsx
console.log(view.first, view.last);
```

A callback that is called for any boundary updates (known as the _boundary owner_) can be set until the current [lifecycle](../lifecycle.md) is disposed. Note, that there can be only one boundary owner at a time.
```jsx
view.setBoundaryOwner((first, last) => {
	// "first" and "last" are the new current boundary.
});
```

To move or detach a view, use the `take` and `detach` functions. They ensure, that a view doens't break when moving or detaching a view with multiple nodes.
```jsx
// Append all nodes of the view to an element:
someElement.append(view.take());

// Detach the view from it's current position:
view.detach();
```

## Implementing Views
When implementing your own view, you need to guarantee that:

+ The view doesn't break when the parent node is replaced or when a view consisting of only a single node is detached from it's parent.
+ The boundary is updated immediately after the first or last node has been updated.
+ If there are multiple nodes, all nodes remain in the current parent.
+ If there are multiple nodes, the initial nodes must have a common parent.

A view is created using the `View` constructor. The example below creates a view that consists of a single text node:
```jsx
import { View } from "@mxjp/gluon";

const view = new View((setBoundary, self) => {
	// "self" is this view instance.

	const node = document.createTextNode("Hello World!");

	// Set the initial first and last node:
	// (This must be called at least once before this callback returns)
	setBoundary(node, node);
});
```
