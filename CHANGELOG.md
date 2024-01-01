# Changelog

## 2.0
+ Add utility for phantom typed context key-value pairs.
+ Add value type to XMLNS context key.
+ Support arbitrarily nested arrays and expressions as class attribute values.
+ Support arbitrarily nested arrays and expressions as style attribute values.
+ **Breaking:** Drop support for css strings in style attributes.
+ **Breaking:** Remove `useNamespace` and `UseNamespace`. Use `inject` or `deriveContext` instead.
+ **Breaking:** Remove `useTasks` and `getTasks`. Use `inject` or `deriveContext` instead.
+ **Breaking:** Remove `@mxjp/gluon/router` exports. Use `@mxjp/gluon` instead.

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
