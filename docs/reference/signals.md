# Signals
In gluon, a `Signal` is an object which holds an arbitrary value and keeps track of things that have accessed that value.

To create a signal, you can use the `Signal` constructor or the `sig` shorthand:
```jsx
import { Signal, sig } from "@mxjp/gluon";

// using the constructor:
const count = new Signal(42);
// or using the shorthand:
const count = sig(42);
```

The current value can be accessed or updated using the `value` property:
```jsx
count.value++;
```

To deeply change a value and then notify the signal dependants, use the `update` function:
```jsx
const items = sig(["a", "b"]);

items.update(items => {
	items.push("c");
});
```

Signals can also be controlled manually:
```jsx
// Pretend that count was accessed:
count.access();

// Pretend that count has changed:
count.notify();
```

## Equality
By default, setting a signal's `value` property only notifies it's dependants if the value is not the same.
```jsx
const count = sig(42);
// This does nothing since the value is already 42:
count.value = 42;
```

The default equality check can be disabled:
```jsx
sig(42, false);
```

By providing a function, a custom equality check can be used:
```jsx
// This is the default behavior:
sig(42, (a, b) => Object.is(a, b));
```

## Expressions
In gluon, an `Expression` can be a static value, a signal or a function that accesses signals.
```jsx
// A static value:
42;
// A signal itself:
sig(42);
// A function that accesses signals:
() => a.value * b.value;
```

## `watch`
Watch an expression and run a callback with it's result.
```jsx
import { watch } from "@mxjp/gluon";

watch(count, value => {
	console.log("Count:", value);
});
```

+ The current [context](context.md) is available in both the expression and callback.
+ Evaluation is stopped when the current [lifecycle](lifecycle.md) is disposed.
+ Teardown hooks from the callback are called when the current [lifecycle](lifecycle.md) is disposed or before the next call.
+ Teardown hooks are not supported in the expression.

## `watchUpdates`
This is the same as [`watch`](#watch), but the initial value is returned instead of being passed to the callback.
```jsx
import { watchUpdates } from "@mxjp/gluon";

const initialCount = watchUpdates(count, value => {
	console.log("Count:", value);
});
```

## `effect`
Run a function and re-run when any accessed signals are updated.

```jsx
import { effect } from "@mxjp/gluon";

effect(() => {
	console.log("Count:", count.value);
});
```

+ The current [context](context.md) is available in the callback.
+ Execution is stopped when the current [lifecycle](lifecycle.md) is disposed.
+ Teardown hooks from the callback are called when the current [lifecycle](lifecycle.md) is disposed or before the next call.

Prefer using [`watch`](#watch) or [`watchUpdates`](#watchupdates) if possible because it's easy to build infinite loops using `effect`:
```jsx
effect(() => {
	// This will cause a stack overflow because this
	// both accesses and updates the value wich will
	// re-run this callback during the update itself:
	count.value++;
});
```

## `batch`
Signal updates are always processed immediately. The `batch` function can be used to deduplicate and defer updates until the batch callback finishes:
```jsx
import { batch } from "@mxjp/gluon";

const a = sig(1);
const b = sig(2);

batch(() => {
	a.value++;
	b.value++;
});
```
If updates from a batch cause immediate recursive side effects, these are also processed as part of the batch.

## `memo`
Watch an expression and get a function to reactively access it's latest result with the same [equality check](#equality) that is also used for signals.
```jsx
import { memo } from "@mxjp/gluon";

const getValue = memo(() => a.value * b.value);
```

+ The current [context](context.md) is available in the expression.
+ Evaluation is stopped when the current [lifecycle](lifecycle.md) is disposed.
+ Teardown hooks are not supported in the expression.
+ The default equality check can be disabled or customized in the same way as in signals by setting the second parameter.

## `track` & `untrack`
Signal accesses are tracked in expressions by default. You can use `untrack` to disable tracking during a function call or `track` to restore the default.
```jsx
import { track, untrack } from "@mxjp/gluon";

watch(() => a.value * untrack(() => b.value), () => { ... });
```

## `get`
Manually evaluate an expression of an unknown type.
```jsx
import { get } from "@mxjp/gluon";

get(42); // 42
get(() => 42); // 42
get(sig(42)); // 42
```

## `map`
Map an expression value while preserving if the expression is static or not.
```jsx
import { map } from "@mxjp/gluon";

// This immediately computes the value:
map(6, value => value * 7);

// This returns a function to compute the value:
map(sig(6), value => value * 7);
```

## `trigger`
Create an expression evaluator pipe that calls a function once when any accessed signals from the latest evaluated expression are updated.

When the lifecycle at which the pipe was created is disposed, the callback function will not be called anymore.
```jsx
import { trigger, sig } from "@mxjp/gluon";

// Create a new pipe that is bound to the current lifecycle:
const pipe = trigger(() => {
	console.log("Signal has been updated.");
});

const signal = sig(42);

// Evaluating an expression through the pipe will track all signal accesses:
console.log(pipe(signal)); // 42
console.log(pipe(() => signal.value)); // 42

// This will trigger the callback:
signal.value = 77;
```

It is guaranteed that the function is called before any other observers like [`watch`](#watch) or [`effect`](#effect) are notified. This can be used to run side effects like clearing a cache before an expression is re-evaluated:
```jsx
import { trigger, sig, watch } from "@mxjp/gluon";

const pipe = trigger(() => {
	console.log("Signal has been updated.");
});

const signal = sig(42);
watch(() => {
	console.log("Evaluating...");
	return pipe(signal);
}, value => {
	console.log("Value:", value);
});

signal.value = 77;
```
```
Evaluating...
Value: 42
Signal has been updated.
Evaluating...
Value: 77
```

If pipes are nested, the callback for the most inner one is called first. In the example below, the callback for `pipeB` is called first:
```jsx
import { trigger, sig } from "@mxjp/gluon";

const pipeA = trigger(() => console.log("Pipe A"));
const pipeB = trigger(() => console.log("Pipe B"));

const signal = sig(42);
pipeA(() => pipeB(signal)); // 42

signal.value = 77;
```



## Immediate Side Effects
By default, signal updates are processed immediately. If an update causes recursive side effects, they run in sequence instead.
```jsx
import { sig, watch } from "@mxjp/gluon";

const count = sig(0);

watch(count, value => {
	console.group("Count:", value);
	if (value < 2) {
		count.value++;
		console.log("New count:", count.value);
	}
	console.groupEnd();
});

console.log("Final count:", count.value);
```
```
Count: 0
	New count: 1
Count: 1
	New count: 2
Count: 2
Final count: 2
```



## Troubleshooting
For signal based reactivity to work, the following is required:

+ The value in a signal must be replaced, or the signal must notify dependants using `notify` or `update`.
+ The place where the value is used must be able to access the signal by calling a function.

### Deep Updates
Signals don't automatically detect when values are deeply changed. They only detect when values are entirely replaced.
```jsx
const counter = sig({ count: 0 });
// This will not trigger any updates:
counter.value.count++;
```

When possible, you should wrap the inner values into signals:
```jsx
const counter = { count: sig(0) };
// Signals can also be deeply nested:
const counter = sig({ count: sig(0) });
```

When this isn't possible, you can use one of the following options:
```jsx
// Use the update function:
counter.update(value => {
	value.count++;
});

// Replace the entire value:
counter.value = { count: 1 };

// Manually notify dependants:
counter.value.count++;
counter.notify();
```

If you need deeply reactive objects, you can use the [store API](./store.md).

### Static Values
The value of signals or expressions can always be accessed in a non reactive ways:
```jsx
const count = sig(0);

// This isn't reactive:
<>{count.value}</>;
<>{get(count)}</>;
```
For signal accesses to be reactive, they need to be done in a function call:
```jsx
// This is now reactive:
<>{() => count.value}</>;
<>{() => get(count)}</>;

// Using the signal itself is also reactive:
<>{count}</>;
```
