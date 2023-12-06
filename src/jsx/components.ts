import { Expression, IterContentFn, MapContentFn, iter, map, nest, show, useNamespace, useUniqueId, when } from "../core/index.js";

type Falsy = null | undefined | false | 0 | 0n | "";

/**
 * A component that renders content depending on an expression.
 *
 * @example
 * ```tsx
 * import { mount, Nest, sig } from "@mxjp/gluon";
 *
 * const count = sig(0);
 *
 * mount(
 *   document.body,
 *   <Nest>
 *     {() => {
 *       const value = count.value;
 *       return () => <>{value}</>;
 *     }}
 *   </Nest>
 * );
 * ```
 */
export function Nest(props: {
	/**
	 * An expression that returns a function to create content or null or undefined to render nothing.
	 */
	children: Expression<(() => unknown) | null | undefined>;
}): unknown {
	return nest(props.children);
}

/**
 * A component that renders conditional content.
 *
 * Content is only re-rendered if the expression result is not strictly equal to the previous one. If this behavior is undesired, use {@link Nest} instead.
 *
 * @example
 * ```tsx
 * import { mount, sig, When } from "@mxjp/gluon";
 *
 * const message = sig<null | string>("Hello World!");
 *
 * mount(
 *   document.body,
 *   <When value={message} else={() => <>No message...</>}>
 *     {value => <h1>{value}</h1>}
 *   </When>
 * );
 * ```
 */
export function When<T>(props: {
	/**
	 * The expression to evaluate.
	 */
	value: Expression<T | Falsy>,

	/**
	 * A function to create content if the value is truthy.
	 */
	children: (value: T) => unknown,

	/**
	 * An optional function to create content if the value is falsy.
	 */
	else?: () => unknown,
}): unknown {
	return when(props.value, props.children, props.else);
}

/**
 * A component that renders content for each unique value in an iterable.
 *
 * Content instances are keyed by value.
 *
 * @example
 * ```tsx
 * import { Map, mount, sig } from "@mxjp/gluon";
 *
 * const items = sig([1, 2, 3]);
 *
 * mount(
 *   document.body,
 *   <Map each={items}>
 *     {value => <li>{value}</li>}
 *   </Map>
 * );
 * ```
 */
export function Map<T>(props: {
	/**
	 * The expression.
	 */
	each: Expression<Iterable<T>>;

	/**
	 * A function to create content for a specific value.
	 */
	children: MapContentFn<T>;
}): unknown {
	return map(props.each, props.children);
}

/**
 * A component that renders content for each value in an iterable.
 *
 * Content instances are keyed by index and value.
 *
 * @example
 * ```tsx
 * import { mount, Iter, sig } from "@mxjp/gluon";
 *
 * const items = sig([1, 2, 3]);
 *
 * mount(
 *   document.body,
 *   <Iter each={items}>
 *     {value => <li>{value}</li>}
 *   </Iter>
 * );
 * ```
 */
export function Iter<T>(props: {
	/**
	 * The expression.
	 */
	each: Expression<Iterable<T>>;

	/**
	 * A function to create content for a specific index and value.
	 */
	children: IterContentFn<T>;
}): unknown {
	return iter(props.each, props.children);
}

/**
 * A component that attaches or detaches content depending on an expression.
 *
 * @example
 * ```tsx
 * import { mount, sig, Show } from "@mxjp/gluon";
 *
 * const showMessage = sig(true);
 *
 * mount(
 *   document.body,
 *   <Show when={showMessage}>
 *     <h1>Hello World!</h1>
 *   </Show>
 * );
 * ```
 */
export function Show(props: {
	/**
	 * The expression to evaluate.
	 */
	when: Expression<boolean>,

	children?: unknown;
}): unknown {
	return show(props.when, props.children);
}

/**
 * A component that renders content while using the specified namespace URI.
 *
 * @example
 * ```tsx
 * import { mount, Namespace, SVG } from "@mxjp/gluon";
 *
 * mount(
 *   document.body,
 *   <Namespace uri={SVG}>
 *     {() => <svg version="1.1">...</svg>}
 *   </Namespace>
 * );
 * ```
 */
export function Namespace(props: {
	uri: string;
	children: () => unknown;
}): unknown {
	return useNamespace(props.uri, props.children);
}

/**
 * A component that provides a unique id to it's children.
 *
 * @example
 * ```tsx
 * import { mount, UseUniqueId } from "@mxjp/gluon";
 *
 * mount(
 *   document.body,
 *   <UseUniqueId>
 *     {id => <>
 *       <label for={id}>Text</label>
 *       <input type="text" id={id} />
 *     </>}
 *   </UseUniqueId>
 * );
 * ```
 */
export function UseUniqueId(props: {
	children: (id: string) => unknown;
}) {
	return useUniqueId(props.children);
}
