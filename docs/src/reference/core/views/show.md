---
order: 1
---

# `<Show>`
Render [content](../elements.md#content) when an [expression](../signals.md#expressions) is truthy.
```tsx
import { Show } from "@mxjp/gluon";

<Show when={someCondition}>
  {() => <>Hello World!</>}
</Show>
```

## Truthy Results
Truthy condition results are passed to the child callback as the first argument.
```tsx
const message = sig("Hello World!");

<Show when={message}>
  {value => <h1>{value}</h1>}
</Show>
```

## Fallback
A function to render fallback content can be specified as the `else` property.
```tsx
<Show when={message} else={() => <>No message.</>}>
  {value => <h1>{value}</h1>}
</Show>
```
