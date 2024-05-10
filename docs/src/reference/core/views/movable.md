---
order: 20
---

# `movable`
Wrap content for safely moving it somewhere else. When moved, content is safely detached from it's previous position.
```tsx
import { movable, Show } from "@mxjp/gluon";

const marker = movable(<>Hello World!</>);

<Show when={a}>
  {() => marker.move()}
</Show>
<Show when={b}>
  {() => marker.move()}
</Show>
```
