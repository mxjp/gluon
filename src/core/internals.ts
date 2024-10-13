import type { ReadonlyContext } from "./context.js";
import type { TeardownHook } from "./lifecycle.js";
import { Expression, watch } from "./signals.js";

/**
 * The next suffix for generating unique ids in the current thread.
 */
export const NEXT_ID: { value: number | bigint } = { value: 0 };

/**
 * A stack where the last item is the current context.
 */
export const CONTEXT_STACK: (ReadonlyContext | undefined)[] = [];

/**
 * A stack where the last item may be an array which teardown hooks are captured in.
 */
export const TEARDOWN_STACK: (TeardownFrame | undefined)[] = [];

export type Falsy = null | undefined | false | 0 | 0n | "";

export type TagNameMap = HTMLElementTagNameMap & SVGElementTagNameMap & MathMLElementTagNameMap;

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
