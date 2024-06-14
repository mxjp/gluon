# `<For>`
Render [content](../elements.md#content) for each unique value in an iterable [expression](../signals.md#expressions).
```jsx
import { For } from "@mxjp/gluon";

<For each={someIterable}>
	{value => <li>{value}</li>}
</For>
```

## Index
A function to reactively access the current index is passed as the second argument:
```jsx
<For each={someIterable}>
	{(value, index) => <li>{() => index() + 1}: {value}</li>}
</For>
```

## Update Order
For every update, this view runs a simple diffing algorithm between existing instances and new unique values.

The following describes the order in which new instances are created, updated or disposed. Any changes to the update order are considered breaking changes.

+ For each new unique value:
	+ Existing instances are moved to the current index.
	+ A new instance is created if there is none.
+ Remaining non-reused instances are disposed in creation order.

When the view itself is disposed, instances are disposed in the latest iteration order.

### Performance
The current implementation has a best case performance of `O(n)` and a practical worst case performance of `O(n * log(n))` with `n` being the new number of items. In practice, this is mostly irrelevant because the majority of time is spend updating the DOM.
