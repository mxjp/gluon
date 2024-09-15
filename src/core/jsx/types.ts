import { Attributes } from "../element.js";

type NativeElement = Element;

export namespace JSX {
	export type IntrinsicElements = {
		[K in string]: Attributes<NativeElement>;
	};

	export interface ElementChildrenAttribute {
		children: {};
	}

	export type Element = unknown;
	export type ElementClass = never;
}
