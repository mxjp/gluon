---
order: 3
---

# `<Nest>`
Render a [component](../components.md) returned from an expression.
```tsx
import { Nest } from "@mxjp/gluon";

const message = sig({ type: "heading", value: "Hello World!" });

<Nest>
  {() => {
    const current = message.value;
    switch (current.type) {
      case "heading": return () => <h1>{current.value}</h1>;
      default: return () => <>Unknown message type.</>;
    }
  }}
</Nest>
```
Returning `null` or `undefined` results in rendering nothing.
