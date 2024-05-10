---
order: -3
---

# Signals
In gluon, a `Signal` is an object which holds an arbitrary value and keeps track of things that have accessed that value.

To create a signal, you can use the `Signal` constructor or the `sig` shorthand:
```tsx
import { Signal, sig } from "@mxjp/gluon";

// using the constructor:
const count = new Signal(42);
// or using the shorthand:
const count = sig(42);
```

The current value can be accessed or updated using the `value` property:
```tsx
count.value++;
```

To deeply change a value and then notify the signal dependants, use the `update` function:
```tsx
const items = sig(["a", "b"]);

items.update(items => {
  items.push("c");
});
```

Signals can also be controlled manually:
```tsx
// Pretend that count was accessed:
count.access();

// Pretend that count has changed:
count.notify();
```

## Equality
By default, setting a signal's `value` property only notifies it's dependants if the value is not the same.
```tsx
const count = sig(42);
// This does nothing since the value is already 42:
count.value = 42;
```

The default equality check can be disabled:
```tsx
sig(42, false);
```

By providing a function, a custom equality check can be used:
```tsx
sig(42, (a, b) => Object.is(a, b));
```

## Expressions
In gluon, an `Expression` can be a static value, a signal or a function that accesses signals.
```tsx
// A static value:
42;
// A signal itself:
sig(42);
// A function that accesses signals:
() => a.value * b.value;
```

## `watch`
Watch an expression and run a callback with it's result.
```tsx
import { watch } from "@mxjp/gluon";

watch(count, value => {
  console.log("Count:", value);
});
```
+ The current [context](context.md) is available in both the expression and callback.
+ Evaluation is stopped when the current [lifecycle](lifecycle.md) is disposed.
+ Teardown hooks from the callback are called when the current [lifecycle](lifecycle.md) is disposed or before the next call.
+ Teardown hooks are not supported in the expression.
+ Setting the second parameter to `true` guarantees that the callback runs before other non-trigger callbacks and during [batches](#batch).

## `watchUpdates`
This is the same as [`watch`](#watch), but the initial value is returned instead of being passed to the callback.
```tsx
import { watchUpdates } from "@mxjp/gluon";

const initialCount = watchUpdates(count, value => {
  console.log("Count:", value);
});
```

## `effect`
Run a function and re-run when any accessed signals are updated.

```tsx
import { effect } from "@mxjp/gluon";

effect(() => {
  console.log("Count:", count.value);
});
```
+ The current [context](context.md) is available in the callback.
+ Execution is stopped when the current [lifecycle](lifecycle.md) is disposed.
+ Teardown hooks from the callback are called when the current [lifecycle](lifecycle.md) is disposed or before the next call.
+  Setting the second parameter to `true` guarantees that the callback runs before other non-trigger callbacks and during [batches](#batch).

Prefer using [`watch`](#watch) or [`watchUpdates`](#watchupdates) if possible because it's easy to build infinite loops using `effect`:
```tsx
effect(() => {
  // This will cause a stack overflow because this
  // both accesses and updates the value wich will
  // re-run this callback during the update itself:
  count.value++;
});
```

## `trigger`
Evaluate an expression and call a function once when any accessed signals are updated.
```tsx
import { trigger } from "@mxjp/gluon";

const currentCount = trigger(count, () => {
  console.log("Count has been changed.");
});
```
+ It is guaranteed that trigger callbacks run before all other non-trigger callbacks.
+ Trigger callbacks run during [batches](#batch).

When using `trigger` in a loop, e.g. in an expression the last `cycle` parameter is passed back into the callback and can be used to keep track of which iteration caused the update.
```tsx
const currentCount = trigger(count, cycle => {
  // cycle === 42
  console.log("Count has been changed.");
}, 42);
```

## `batch`
Signal updates are always processed immediately. The `batch` function can be used to deduplicate and defer updates until the batch callback finishes:
```tsx
import { batch } from "@mxjp/gluon";

const a = sig(1);
const b = sig(2);

batch(() => {
  a.value++;
  b.value++;
});
```

## `lazy`
Wrap an expression to be evaluated only when it is used **and** any accessed signals have been updated. This is meant to avoid expensive computations.
```tsx
import { lazy } from "@mxjp/gluon";

const getValue = lazy(() => someExpensiveComputation(a.value, b.value));
```
+ This inherits the [context](context.md) and [lifecycle](lifecycle.md) behavior from where it's used. E.g:
  + When used inside the expression of [`watch`](#watch), teardown hooks are not supported.
  + When used inside the callback of [`effect`](#effect), teardown hooks are supported.

## `memo`
Watch an expression and get a function to reactively access it's latest result with the same [equality check](#equality) that is also used for signals.
```tsx
import { memo } from "@mxjp/gluon";

const getValue = memo(() => a.value * b.value);
```
+ The current [context](context.md) is available in the expression.
+ Evaluation is stopped when the current [lifecycle](lifecycle.md) is disposed.
+ Teardown hooks are not supported in the expression.
+ The default equality check can be disabled or customized in the same way as in signals by setting the second parameter.

## `track` & `untrack`
Signal accesses are tracked in expressions by default. You can use `untrack` to disable tracking during a function call or `track` to restore the default.
```tsx
import { track, untrack } from "@mxjp/gluon";

watch(() => a.value * untrack(() => b.value), () => { ... });
```

## `get`
Manually evaluate an expression of an unknown type.
```tsx
import { get } from "@mxjp/gluon";

get(42); // 42
get(() => 42); // 42
get(sig(42)); // 42
```

## `map`
Map an expression value while preserving if the expression is static or not.
```tsx
import { map } from "@mxjp/gluon";

// This immediately computes the value:
map(6, value => value * 7);

// This returns a function to compute the value:
map(sig(6), value => value * 7);
```
