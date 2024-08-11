# Changelog

## 12.0
+ **Breaking:** Publix exports have been removed: `appendContent`, `setAttributes`, `createText`.

## 11.1
+ **Deprecated:** Public exports will be removed: `appendContent`, `setAttributes`, `createText`.
+ Add `MemoryRouter`.

## 11.0
+ **Breaking:** `trigger` argument has been removed from `watch`, `watchUpdates` and `effect`.
+ **Breaking:** Immediate render side effects in `<Nest>`, `<Show>`, `<For>` and `<IndexFor>` are now sequential.
+ Support practically infinite unique ids.
+ Support infinitely chained immediate signal updates.
+ Add `sequential` parameter to `watch` & `effect`.

## 10.2
+ Support immediate side effects in `watch` callbacks.
+ Support immediate render side effects in `<Nest>` and `<Show>`.

## 10.1
+ Add `GluonElement` as a base for web components.
+ Fix signal equality check of `NaN` values.

## 10.0
+ **Breaking:** Remove `trimBase` path utility. Use `relative` instead.
+ **Breaking:** Fix nested routing behavior for history routers with a base path.
+ **Breaking:** Remove previously exported internal `formatPath`.
+ Add `relative` path utility.

## 9.1
+ Add `trimBase` router path utility.
+ Add `basePath` option to history router.

## 9.0
+ **Breaking:** Using teardown hooks inside expressions now throws an error.
+ **Breaking:** `<For>` and `<IndexFor>` now also re-render when anything that is accessed during iteration is updated.
+ Add `nocapture` utility to explicitly un-support teardown hooks in specific contexts.
+ Add `trigger` parameter to `watch` and `watchUpdates`.
+ Add `effect` utility.

## 8.0
+ **Breaking:** Fix nested batch behavior: Updates during batches are now deferred until all current batches are complete.

## 7.1
+ Add `Signal.active` property.
+ Add `isTracking` utility.

## 7.0
+ **Breaking:** Rewrite route matching for ease of use and better tree shaking:
  + Support arbitrary iterable expressions as routes.
  + Custom route matchers must now return an object with normalized paths.

## 6.1
+ Add support for rendering document fragments.

## 6.0
+ **Breaking:** Async and router exports have been moved to `@mxjp/gluon/async` and `@mxjp/gluon/router`.
+ **Breaking:** Memos no longer run during batches.
+ **Breaking:** `trigger` argument has been removed from `watch` and `watchUpdates`.
+ **Breaking:** The following components have been renamed:
  + `<Show>` => `<Attach>`
  + `<When> => <Show>`
  + `<IterUnique> => <For>`
  + `<Iter> => <IndexFor>`
+ **Breaking:** The following functions have been removed:
  + `useUniqueId` - Use `uniqueId` or `<UseUniqueId>` instead.
  + `nest` - Use `<Nest>` instead.
  + `when` - Use `<Show>` instead.
  + `iterUnique` - Use `<For>` instead.
  + `iter` - Use `<IndexFor>` instead.
  + `show` - Use `<Attach>` instead.
+ Components are now also included in pre-bundled versions.
+ Fix broken query formatting in history and hash router.
+ Fix hash router listening to the wrong events.

## 5.7
+ Add `watchUpdates` utility.

## 5.6
+ Export `sharedGlobal` and `shareInstanceOf` utilities.

## 5.5
+ Add event API.

## 5.4
+ Add `Signal.pipe` utility.

## 5.3
+ Add `@mxjp/gluon/test` utilities.

## 5.2
+ Add `TaskSlot`.
+ Make all internal globals shared between different gluon versions in the same thread.
+ Make instances of `View` and `Signal` recognizable across different gluon versions.

## 5.1
+ The following APIs now cause unhandled rejections if an error isn't handled at all:
  + `waitFor(..)` and `Tasks.waitFor(..)`
  + `async(..)` and `<Async>` if there is no rejection callback and no `AsyncContext`.
  + `AsyncContext.track(..)` if the error wasn't handled by an `AsyncContext.complete(..)` call.

## 5.0
+ **Breaking:** Restore focus on the last active element by default when there are no more pending tasks.
+ **Breaking:** Rename `map/Map` to `iterUnique/IterUnique`.
+ **Breaking:** Remove `mapper` utility.
+ **Breaking:** Add `map` utility for mapping expression values.

## 4.1
+ Add watchable `pending` property to async contexts.

## 4.0
+ Add `Tasks.fork` utility.
+ Add `async` and `Async` for asynchronous rendering with a separate tracking system.
+ **Breaking:** Remove class based context keys.
+ **Breaking:** `inject` now requires a **key** and **value** instead of a **pair** argument.
+ **Breaking:** Renamed `ContextKeyFor` to `ContextKey`.
+ **Breaking:** Renamed `ContextValueFor` to `ContextValue`.
+ **Breaking:** Removed `unwrap` and `Unwrap`. Use `async/Async` instead.

## 3.2
+ Add `captureSelf` utility.

## 3.1
+ Add `watchFor` utility.

## 3.0
+ **Breaking:** Remove `jsx` argument from `createElement` and `setAttributes`.
+ JSX element type is now `unknown`.
+ Support legacy react jsx transform.
+ Notable internal changes, that most likely don't require migration:
  + Moved JSX runtime modules to `/dist/es/core/jsx/r17.{js,d.ts}`.
  + The React 17 JSX runtime now deletes the `children` property from the `prop` argument before creating an element.

## 2.4
+ Add `viewNodes` iterator.

## 2.3
+ Use hyphen cased style properties. (Exact behavior was previously unspecified)

## 2.2
+ Add manual pending tasks: `Tasks.setPending` and `setPending`.

## 2.1
+ Add expression mapping utilities: `mapper`, `string` and `optionalString`.

## 2.0
+ Add support for generic boolean attributes.
+ Add utility for phantom typed context key-value pairs.
+ Add value type to XMLNS context key.
+ Add value type to ROUTER context key.
+ Support arbitrarily nested arrays and expressions as class & style attribute values.
+ Fix missing key properties in jsx expressions.
+ **Breaking:** Drop support for css strings in style attributes.
+ **Breaking:** Remove `useNamespace` and `UseNamespace`. Use `inject` or `deriveContext` instead.
+ **Breaking:** Remove `useTasks` and `getTasks`. Use `inject` or `deriveContext` instead.
+ **Breaking:** Remove `@mxjp/gluon/router` exports. Use `@mxjp/gluon` instead.
+ **Breaking:** Remove `stylesheet` utility.
+ **Breaking:** Set all attributes except **class** and **style** as attributes by default. To set as properties, prefix attribute names with `prop:`.

## 1.3
+ Support context in expressions.
+ Add abort signal utilities.
+ Add pending task tracking.
+ Add unwrap utility.

## 1.2
+ Make router available from `@mxjp/gluon`.
+ **Deprecated:** Imports from `@mxjp/gluon/router`.

## 1.1
+ Add routing.
