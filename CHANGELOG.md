# Changelog

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
