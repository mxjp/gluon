import type { TeardownHook } from "./lifecycle.js";
import { Expression, watch } from "./signals.js";

export type Falsy = null | undefined | false | 0 | 0n | "";

export type TagNameMap = HTMLElementTagNameMap & SVGElementTagNameMap & MathMLElementTagNameMap;

/**
 * A function that is stored inside any accessed signals alongside a cycle.
 */
export interface DependantFn {
	(cycle: number): void;
}

/**
 * A pair of dependant function and the cycle it was captured at.
 */
export type Dependant = [fn: DependantFn, cycle: number];

/**
 * Represents a stack frame that teardown hooks can be pushed into.
 *
 * Note that this may be an array.
 */
export interface TeardownFrame {
	push(hook: TeardownHook): void;
}

/**
 * Internal utility to create placeholder comments.
 */
export function createPlaceholder(): Node {
	return document.createComment("g");
}

/**
 * Internal utility to create an arbitrary parent node.
 */
export function createParent(): Node {
	return document.createDocumentFragment();
}

/**
 * Internal utility to extract an inclusive range of nodes.
 */
export function extractRange(first: Node, last: Node): DocumentFragment {
	const r = new Range();
	r.setStartBefore(first);
	r.setEndAfter(last);
	return r.extractContents();
}

/**
 * Internal utility to call a function with a specific stack frame.
 */
export function useStack<T, R>(stack: T[], frame: T, fn: () => R): R {
	try {
		stack.push(frame);
		return fn();
	} finally {
		stack.pop();
	}
}

/**
 * Create a text node that displays the result of an expression.
 *
 * Null and undefined are displayed as an empty string.
 */
export function createText(expr: Expression<unknown>): Text {
	const text = document.createTextNode("");
	watch(expr, value => text.textContent = (value ?? "") as string);
	return text;
}

export const NOOP = (): void => {};
