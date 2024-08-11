import type { ReadonlyContext } from "./context.js";
import { sharedGlobal } from "./globals.js";
import type { TeardownHook } from "./lifecycle.js";

export type Falsy = null | undefined | false | 0 | 0n | "";

export type TagNameMap = HTMLElementTagNameMap & SVGElementTagNameMap & MathMLElementEventMap;

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

export interface InternalGlobals {
	/**
	 * The next suffix for generating unique ids in the current thread.
	 */
	NEXT_ID: { value: number | bigint };

	/**
	 * A stack where the last item is the current context.
	 */
	CONTEXT_STACK: (ReadonlyContext | undefined)[];

	/**
	 * A stack where the last item may be an array which teardown hooks are captured in.
	 */
	TEARDOWN_STACK: (TeardownFrame | undefined)[];

	/**
	 * A stack where the last item is the current signal batch. This may be empty.
	 */
	BATCH_STACK: Dependant[][];

	/**
	 * A stack where the last item indicates if signal access is currently tracked. This contains at least `true` by default.
	 */
	TRACKING_STACK: boolean[];

	/**
	 * A stack where the last item is an array of triggers to capture in any accessed signals. This is never empty.
	 */
	TRIGGERS_STACK: Dependant[][];

	/**
	 * A stack where the last item is an array of dependants to capture in any accessed signals. This is never empty.
	 */
	DEPENDANTS_STACK: Dependant[][];
}

export const INTERNAL_GLOBALS = sharedGlobal("gluon:globals", () => ({} as InternalGlobals));

INTERNAL_GLOBALS.NEXT_ID ??= { value: 0 };
INTERNAL_GLOBALS.CONTEXT_STACK ??= [];
INTERNAL_GLOBALS.TEARDOWN_STACK ??= [];
INTERNAL_GLOBALS.BATCH_STACK ??= [];
INTERNAL_GLOBALS.TRACKING_STACK ??= [true];
INTERNAL_GLOBALS.TRIGGERS_STACK ??= [[]];
INTERNAL_GLOBALS.DEPENDANTS_STACK ??= [[]];

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
