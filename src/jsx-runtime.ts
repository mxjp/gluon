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

	export type Element = HTMLElement & SVGElement & MathMLElement;

	export type ElementClass = never;
}
