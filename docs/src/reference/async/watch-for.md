# `watchFor`
This is a utility for watching an expression until it's output satisfies a condition.
```tsx
// Wait for an expression to return a truthy result:
await watchFor(() => signal.value > 42);

// Wait for an expression to match a condition and get the matching expression result:
const value = await watchFor(signal, value => value > 42);
```

## Timeouts
When a timeout is specified and exceeded, a `WatchForTimeoutError` is thrown:
```tsx
// Use a timeout of 2000 milliseconds:
await watchFor(signal, value => value > 42, 2000);
```

By default, no timeout is used and the returned promise will never resolve if the condition is never met.
