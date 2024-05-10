---
order: -1
---

# `<Async>`
The `<Async>` component is meant for asynchronous rendering. E.g. loading page content.
```tsx
import { Async } from "@mxjp/gluon/async";

// main.tsx:
<Async source={() => import("./page")}>
  {page => <page.content />}
</Async>

// page.tsx:
export function content() {
  return <h1>Hello World!</h1>;
}
```

The `rejected` and `pending` properties can be used for rendering content when the promise is rejected or pending:
```tsx
<Async
  source={() => import("./page")}
  pending={() => <>Loading...</>}
  rejected={error => <>Error: {error}</>}
>
  {page => <page.content />}
</Async>
```

## Tracking Completion
To wait for async parts in a specific context to complete, you can use `AsyncContexts`:
```tsx
import { ASYNC, AsyncContext } from "@mxjp/gluon/async";

const ctx = new AsyncContext();

<Inject key={ASYNC} value={ctx}>
  {() => <Async>...</Async>}
</Inject>

// Wait for all "<Async>" parts to complete and re-throw unhandled errors:
await ctx.complete();

// Or manually track an async task:
ctx.track(fetch("something"));
```
