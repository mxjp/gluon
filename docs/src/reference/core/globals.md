# Globals
Gluon's signal, context and lifecycle APIs are based on globals and the synchronous call stack.

**Example:** To capture lifecycle teardown hooks, the capture function pushes a new array onto a global stack and then runs a synchronous function which may add teardown hooks to that array. After this the array is removed from the stack and will contain all the registered teardown hooks which can be called later.

From **gluon v5.2** and upwards, these globals are shared between different versions of gluon that run on the same thread. Additionally, the instanceof operator will also work with `View` and `Signal` instances from other versions.

This makes it possible to use newer versions of gluon without being forced to update dependencies. For instance, when using gluon v6, you could still use a UI library based on gluon v5.2 just fine.

## Utilities
The utilities below are for use in libraries and it's very unlikely you will ever need them in application code.

When using them, you must guarantee that all future versions of your library are compatible with the earliest version these have been used in with respect to the specified keys.

### `sharedGlobal`
Get or create a shared global value.
```tsx
import { sharedGlobal } from "@mxjp/gluon";

const SOME_GLOBAL = sharedGlobal("example", () => new Map<string, string>());
```
The value is stored on the `globalThis` object with a symbol obtained with `Symbol.for` and the specified key.

### `shareInstancesOf`
Ensure that instances of the target class are also recognized as instances of the same target class from other library versions.
```tsx
import { shareInstancesOf } from "@mxjp/gluon";

class Example {
  static {
    shareInstancesOf(this, "example");
  }
}
```
This attaches a marker to all instances of the class and overwrites the `hasInstance` function of the target class to check if that marker exists. The marker is stored in the prototype using a symbol obtained with `Symbol.for` and the specified key.
