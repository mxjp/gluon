---
order: 10
---

# `<For>`
Render [content](../elements.md#content) for each unique value in an iterable [expression](../signals.md#expressions).
```tsx
import { For } from "@mxjp/gluon";

<For each={someIterable}>
  {value => <li>{value}</li>}
</For>
```

## Index
A function to reactively access the current index is passed as the second argument:
```tsx
<For each={someIterable}>
  {(value, index) => <li>{() => index() + 1}: {value}</li>}
</For>
```
