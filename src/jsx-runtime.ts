import { Attributes, createElement } from "./element.js";

export const Fragment = Symbol("fragment");

export function jsx(tagName: string | typeof Fragment, props: Attributes & { children?: unknown }): unknown {
	if (tagName === Fragment) {
		return props.children;
	}
	return createElement(tagName, props, [props.children], true);
}

export function jsxs(tagName: string | typeof Fragment, props: Attributes & { children: unknown[] }): unknown {
	if (tagName === Fragment) {
		return props.children;
	}
	return createElement(tagName, props, props.children, true);
}

export namespace JSX {
	export type IntrinsicElements = {
		[K in string]: Attributes;
	};

	/**
	 * In case of fragments, the returned element is actually just it's content without any special wrapper.
	 */
	export type Element = HTMLElement & SVGElement & MathMLElement;

	/**
	 * Class and function components are not supported by gluon.
	 *
	 * Unfortunately there is currently no way to type the JSX runtime in
	 * a way that prevents the use of function components.
	 */
	export type ElementClass = never;
}
