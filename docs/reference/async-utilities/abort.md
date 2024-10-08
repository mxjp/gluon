# Abort Controllers
Abort controllers can be used in many web APIs to abort things.

The `useAbortController` and `useAbortSignal` functions can be used to abort things when the current [lifecycle](../lifecycle.md) is disposed:
```jsx
import { useAbortSignal } from "@mxjp/gluon/async";

// Abort a fetch request when disposed:
fetch("/info.txt", { signal: useAbortSignal() });

// Remove an event listener when disposed:
window.addEventListener("keydown", () => { ... }, { signal: useAbortSignal() });
```
