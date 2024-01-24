/* eslint-disable */
import { createElement } from "../element.js";

export * from "./types.js";

export const Fragment = Symbol.for("gluon:jsx-fragment");

const NO_PROPS = {};

export function jsx(type: any, props: any, ...children: any[]): unknown {
	if (type === Fragment) {
		return children;
	}
	if (typeof type === "function") {
		if (children.length > 0) {
			props.children = children;
		}
		return type(props);
	}
	return createElement(type, props ?? NO_PROPS, children);
}
