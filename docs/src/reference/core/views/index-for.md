---
order: 11
---

# `<IndexFor>`
Render [content](../elements.md#content) for each index in an iterable [expression](../signals.md#expressions).
```tsx
import { IndexFor } from "@mxjp/gluon";

<IndexFor each={someIterable}>
  {value => <li>{value}</li>}
</IndexFor>
```

## Index
The index is passed as the second argument:
```tsx
<IndexFor each={someIterable}>
  {(value, index) => <li>{() => index + 1}: {value}</li>}
</IndexFor>
```
