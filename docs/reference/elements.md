# Elements
To create an element, you can either use JSX element expressions:
```jsx
<div />
<div class="example" />
<div class="example">Hello World!</div>
```

To create an element from a dynamic tag name, use the `createElement` function:
```jsx
import { createElement } from "@mxjp/gluon";

createElement("div", {}, undefined);
createElement("div", { class: "example" }, undefined);
createElement("div", { class: "example" }, "Hello World!");
```

In environments where no JSX transpiler is available, you can use the `e` function which is the same as `createElement` but with the option to not specify attributes or content:
```jsx
import { e } from "@mxjp/gluon";

e("div");
e("div", { class: "example" });
e("div", { class: "example" }, ["Hello World!"]);
e("div", ["Hello World!"]);
```

## Attributes
Attributes are set using `setAttribute` or `removeAttribute` by default.

+ Attributes set to `null`, `undefined` or `false` are removed.
+ Attributes set to `true` are set as an empty string.
+ All other values are set as strings.
+ Attributes prefixed with `prop:` are always set using the respective JavaScript properties.
+ Attributes prefixed with `attr:` are always set using the default behavior.
+ Attributes prefixed with `on:` are added as regular event listeners. An array can be used to pass the event listener with additional options.
+ The [`class`](#classes) and [`style`](#styles) attributes are special cases described below.

```jsx
// Using setAttribute:
<input value="Example" />

// Using the "value" property:
<input prop:value="Example" />

// Setting a boolean attribute:
<input disabled />;
<input disabled={true} />

// Removing a boolean attribute:
<input disabled={false} />

// Adding event listeners:
<button on:click={event => { ... }}>Click me!</button>
<button on:click={[event => { ... }, { capture: true, passive: true }]}>Click me!</button>
```

Attribute values can be [expressions](signals.md#expressions).
```jsx
// Static values:
<div title="Hello World!" />
<div title={"Hello World!"} />

// Signals:
<div title={someSignal} />

// Functions:
<div title={() => someSignal.value} />
```

Note, that the rules specified above apply to all attributes including aria attributes. To set an attribute to the literal `"true"` and `"false"` strings, you can convert an arbitrary [expression](signals.md#expressions) using `string` or `optionalString`:
```jsx
import { string, optionalString } from "@mxjp/gluon";

<div aria-disabled={string(someBooleanExpression)} />
<div aria-disabled={optionalString(someBooleanExpression)} />
```

## Classes
The `class` attribute can be any combination of strings, arrays and objects with boolean [expressions](signals.md#expressions) to determine which classes are added. `undefined`, `null` and `false` is ignored.
```jsx
<div class="example" />
<div class={[
	"foo",
	() => "bar",
	{
		baz: true,
		boo: () => false,
	},
]} />
```

Note, that all expressions used in the class attribute are evaluated for every signal update. To avoid expensive computations, use `lazy` or `memo` if needed.

To avoid this special behavior, you can use the `attr:` prefix:
```jsx
<div attr:class="example">
```

## Styles
The **style** attribute can be any combination of arrays, objects and [expressions](signals.md#expressions).

Properties use the same casing as in css.
```jsx
<div style={{ color: "red" }} />
<div style={() => [
	{
		color: "red",
		"font-size": "1rem",
	},
	{ color: () => "blue" },
	{ color: someSignal },
	[
		{ width: "42px" },
	],
]} />
```

Note, that properties that are no longer specified after a signal update are not reset automatically to keep the current implementation simple. When properties are specified multiple times, the last one is used.

To avoid this special behavior, you can use the `attr:` prefix:
```jsx
<div attr:style="color: red;">
```

## References
To get the reference to an element, you can either use the JSX expression directly:
```jsx
const input = <input /> as HTMLInputElement;
```

Or use the special `ref` attribute:
```jsx
<input ref={input => { ... }} />;
```

All attributes (except `key`) are processed in the specified order. In the example below, the `ref` function is called after `data-a` is set, but before `data-b` is set:
```jsx
<input data-a ref={input => { ... }} data-b />;
```

## Content
Everything listed below can be used as element content or can be returned from [component](components.md) functions.

### Text
Expressions (static values, signals and functions) are rendered as escaped text content. `null` and `undefined` are rendered as an empty string:
```jsx
<div>
	Static text
	{"Static text"}
	{someSignal}
	{() => someSignal.value}
</div>
```

### Nodes
Any DOM nodes are moved into the parent element.
```jsx
<div>
	<input />
	{document.createElement("div")}
</div>
```

Note, that nodes are removed from their parent depending on when the content is actually used in an element. E.g. when returning a document fragment from a [component](components.md), it's children are removed from the fragment as soon as the components return value is used in an element expression.

### Views
When [views](views/index.md) are used as content, they are owned by the element expression until the [lifecycle](lifecycle.md) during which the element was created is disposed.
```jsx
import { Show } from "@mxjp/gluon";

<div>
	<Show when={someSignal}>
		{() => <>Hello World!</>}
	</Show>
</div>
```

Reusing views while they are still attached to somewhere else results in undefined behavior. To safely move views around, consider using [`movable`](./views/movable.md) views.

### Arrays & Fragments
Content can be wrapped in arbitrarily nested arrays and JSX fragments.
```jsx
<div>
	<>
		{[
			"Hello World!",
			<div />,
		]}
	</>
</div>
```
Note, that JSX fragments in gluon return their children as is. The return type of single-child or empty fragments may depend on your JSX transpiler.
```jsx
<></> // undefined
<>42</> // 42
<>foo{"bar"}</> // ["foo", "bar"]
```

## Namespaces
By default, elements are created as HTML elements. This works fine for most cases, but requires some extra work to create **SVG** or **MathML** elements.

The namespace URI for new elements can be [injected](context.md).
```jsx
import { Inject, XMLNS, SVG } from "@mxjp/gluon";

<Inject key={XMLNS} value={SVG}>
	{() => <svg viewBox="0 0 100 100">...</svg>}
</Inject>
```
