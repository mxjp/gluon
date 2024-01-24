import { Attributes } from "../element.js";

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
