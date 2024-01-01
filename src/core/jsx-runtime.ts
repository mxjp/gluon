import { Attributes, createElement } from "./element.js";

export const Fragment = Symbol.for("gluon:jsx-fragment");

export function jsx(type: any, props: any): unknown {
	if (type === Fragment) {
		return props.children;
	}
	if (typeof type === "function") {
		return type(props);
	}
	return createElement(type, props, [props.children], true);
}

export function jsxs(type: any, props: any): unknown {
	if (type === Fragment) {
		return props.children;
	}
	if (typeof type === "function") {
		return type(props);
	}
	return createElement(type, props, props.children, true);
}

export namespace JSX {
	export type IntrinsicElements = {
		[K in string]: Attributes;
	};

	export interface ElementChildrenAttribute {
		children: {};
	}

	export type Element = any;
	export type ElementClass = never;
}
