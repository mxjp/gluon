---
title: Compatibility
order: 1
---

# Shared Globals & Compatibility
Gluon's signal, context and lifecycle APIs are based on globals and the synchronous call stack.

**Example:** To capture lifecycle teardown hooks, the capture function pushes a new array onto a global stack and then runs a synchronous function which may add teardown hooks to that array. After this the array is removed from the stack and will contain all the registered teardown hooks which can be called later.

From **gluon v5.2** and upwards, these globals are shared between different versions of gluon that run on the same thread. Additionally, the instanceof operator will also work with `View` and `Signal` instances from other versions.

This makes it possible to use newer versions of gluon without being forced to update dependencies. For instance, when using gluon v6, you could still use a UI library based on gluon v5.2 just fine.
