# `<IndexFor>`
Render [content](../elements.md#content) for each index in an iterable [expression](../signals.md#expressions).
```jsx
import { IndexFor } from "@mxjp/gluon";

<IndexFor each={someIterable}>
  {value => <li>{value}</li>}
</IndexFor>
```

## Index
The index is passed as the second argument:
```jsx
<IndexFor each={someIterable}>
  {(value, index) => <li>{() => index + 1}: {value}</li>}
</IndexFor>
```
