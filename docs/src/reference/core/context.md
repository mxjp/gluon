# Context
Contexts can be used to implicitly pass static key value pairs along the call stack.

Context automatically work with synchronous code & all gluon APIs.

+ The `inject` function runs a callback and provides a single key value pair.
+ The `extract` function gets a value from the current context.

```tsx
import { inject, extract } from "@mxjp/gluon";

inject("message", "Hello World!", () => {
  extract("message"); // "Hello World!"
  extract("something else"); // undefined
});
```

To inject multiple keys or to delete keys from a context, use `deriveContext`:
```tsx
import { deriveContext, extract } from "@mxjp/gluon";

deriveContext(ctx => {
  ctx.set("message", "Hello World!");
  ctx.delete("something else");

  extract("message"); // "Hello World!"
});
```

## Components
To use contexts while rendering, you can use the `<Inject>` and `<DeriveContext>` components:
```tsx
import { Inject, DeriveContext, extract } from "@mxjp/gluon";

<Inject key="value" value={42}>
  {() => <>Value: {extract("value")}</>}
</Inject>

<DeriveContext>
  {ctx => {
    ctx.set("value", 42);
    return <>Value: {extract("value")}</>;
  }}
</DeriveContext>
```

## Typed Keys
Context values are typed as `unknown` by default.

You can use symbols in combination with the `ContextKey` type as keys:
```tsx
import { ContextKey, inject, extract } from "@mxjp/gluon";

const MESSAGE = Symbol("message") as ContextKey<string>;

inject(MESSAGE, "Hello World!", () => {
  extract(MESSAGE); // Type: string | undefined
});

// This is now a compiler error:
inject(MESSAGE, 42, () => { ... });
```

## Async Code
Since contexts rely on the synchronous call stack, they only work partially with async code:
```tsx
import { inject, extract } from "@mxjp/gluon";

inject("message", "Hello World!", async () => {
  extract("message"); // "Hello World!"
  await something;
  extract("message"); // undefined
});
```

You can manually pass contexts to somewhere else to fix this:
```tsx
import { inject, extract, getContext, runInContext } from "@mxjp/gluon";

inject("message", "Hello World!", async () => {
  // Get a reference to the current context:
  const context = getContext();

  await something;

  // Run a function within the context from above:
  runInContext(context, () => {
    extract("message"); // "Hello World!"
  });
});
```
