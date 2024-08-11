import { ContextKey, extract, wrapContext } from "./context.js";
import { TagNameMap } from "./internals.js";
import { createText } from "./render.js";
import { Expression, get, watch } from "./signals.js";
import { View } from "./view.js";

/**
 * Namespace URI for HTML elements.
 */
export const HTML = "http://www.w3.org/1999/xhtml";

/**
 * Namespace URI for SVG elements.
 */
export const SVG = "http://www.w3.org/2000/svg";

/**
 * Namespace URI for MathML elements.
 */
export const MATHML = "http://www.w3.org/1998/Math/MathML";

/**
 * Key for setting the namespace URI for newly created elements.
 *
 * @example
 * ```tsx
 * import { XMLNS, SVG, Inject } from "@mxjp/gluon";
 *
 * <Inject key={XMLNS} value={SVG}>
 *   {() => <svg>...</svg>}
 * </Inject>
 * ```
 */
export const XMLNS = Symbol.for("gluon:namespace") as ContextKey<typeof HTML | typeof SVG | typeof MATHML>;

/**
 * Append content to a node.
 *
 * @param node The node.
 * @param content The content to append.
 */
function appendContent(node: Node, content: unknown): void {
	if (content === null || content === undefined) {
		return;
	}
	if (Array.isArray(content)) {
		for (let i = 0; i < content.length; i++) {
			appendContent(node, content[i]);
		}
	} else if (content instanceof Node) {
		node.appendChild(content);
	} else if (content instanceof View) {
		node.appendChild(content.take());
	} else {
		node.appendChild(createText(content));
	}
}

export type ClassValue = Expression<undefined | null | false | string | Record<string, Expression<boolean | undefined>> | ClassValue[]>;

type HyphenCase<T> = T extends `${infer A}${infer B}`
	? `${A extends Capitalize<A> ? "-" : ""}${Lowercase<A>}${HyphenCase<B>}`
	: T;

export type StyleMap = {
	[K in keyof CSSStyleDeclaration as HyphenCase<K>]?: Expression<undefined | null | string>;
} & {
	[K in string]?: Expression<undefined | null | string>;
};

export type StyleValue = Expression<undefined | StyleMap | StyleValue[]>;

/**
 * Represents an object with element attributes.
 */
export type Attributes = {
	class?: ClassValue;
	style?: StyleValue;
} & {
	[K in keyof HTMLElementEventMap as `$${K}` | `$$${K}`]?: (event: HTMLElementEventMap[K]) => void;
} & {
	[K in `prop:${string}`]?: Expression<unknown>;
} & {
	[K in `attr:${string}`]?: Expression<unknown>;
} & {
	[K in string]?: Expression<unknown>;
};

function setAttr(elem: Element, name: string, value: unknown): void {
	if (value === null || value === undefined || value === false) {
		elem.removeAttribute(name);
	} else {
		elem.setAttribute(name, value === true ? "" : value as string);
	}
}

function getClassTokens(value: ClassValue): string {
	value = get(value);
	if (typeof value === "string") {
		return value;
	} else if (value) {
		let tokens = "";
		if (Array.isArray(value)) {
			for (let i = 0; i < value.length; i++) {
				tokens += getClassTokens(value[i]) + " ";
			}
		} else {
			for (const key in value) {
				if (get(value[key])) {
					tokens += key + " ";
				}
			}
		}
		return tokens;
	}
	return "";
}

type StyleHandler = (name: string, value: unknown) => void;

function watchStyle(value: StyleValue, handler: StyleHandler) {
	watch(value, value => {
		if (Array.isArray(value)) {
			const overwrites: string[][] = [];
			for (let i = value.length - 1; i >= 0; i--) {
				const self: string[] = [];
				overwrites[i] = self;
				watchStyle(value[i], (name, value) => {
					if (!self.includes(name)) {
						self.push(name);
					}
					for (let o = i + 1; o < overwrites.length; o++) {
						if (overwrites[o].includes(name)) {
							return;
						}
					}
					handler(name, value);
				});
			}
		} else if (value) {
			for (const name in value) {
				watch(value[name]!, value => handler(name, value));
			}
		}
	});
}

/**
 * Set attributes on an element.
 *
 * @param elem The element.
 * @param attrs The attributes to set.
 */
function setAttributes(elem: Element, attrs: Attributes): void {
	for (const name in attrs) {
		const value = attrs[name as keyof Attributes];
		if (value !== undefined) {
			if (name[0] === "$") {
				const capture = name[1] === "$";
				const event = name.slice(capture ? 2 : 1);
				elem.addEventListener(event, wrapContext(value as (event: Event) => void), { capture });
			} else if (name.startsWith("prop:")) {
				const prop = name.slice(5);
				watch(value, value => (elem as any)[prop] = value);
			} else if (name.startsWith("attr:")) {
				const attr = name.slice(5);
				watch(value, value => setAttr(elem, attr, value));
			} else if (name === "style") {
				const style = (elem as HTMLElement).style;
				watchStyle(value as StyleValue, (name, value) => {
					style.setProperty(name, value ? String(value) : null);
				});
			} else if (name === "class") {
				watch(() => getClassTokens(value as ClassValue), tokens => {
					elem.setAttribute("class", tokens);
				});
			} else {
				watch(value, value => setAttr(elem, name, value));
			}
		}
	}
}

/**
 * Create an element.
 *
 * @param tagName The tag name.
 * @param attrs The attributes to set.
 * @param content The content to append.
 * @returns The element.
 */
export function createElement<K extends keyof TagNameMap>(tagName: K, attrs: Attributes, content: unknown): TagNameMap[K];
export function createElement<E extends Element>(tagName: string, attrs: Attributes, content: unknown): E;
export function createElement(tagName: string, attrs: Attributes, content: unknown): Element {
	const elem = document.createElementNS(extract(XMLNS) ?? HTML, tagName);
	setAttributes(elem, attrs);
	appendContent(elem, content);
	return elem;
}

/**
 * Shorthand for creating an element in places where JSX can't be used.
 *
 * @param tagName The tag name.
 * @param attrs The attributes to set.
 * @param content An array of content to append.
 * @returns The element.
 *
 * @example
 * ```ts
 * import { e } from "@mxjp/gluon";
 *
 * // Element with content only:
 * e("div", [
 *   // Element with attributes only:
 *   e("div", { class: "example" }),
 *   // Element with attributes and content:
 *   e("div", { class: "example" }, [
 *     "Hello World!",
 *   ]),
 * ]);
 * ```
 */
export function e<K extends keyof TagNameMap>(tagName: K, content?: unknown[]): TagNameMap[K];
export function e<K extends keyof TagNameMap>(tagName: K, attrs?: Attributes, content?: unknown[]): TagNameMap[K];
export function e<E extends Element>(tagName: string, content?: unknown[]): E;
export function e<E extends Element>(tagName: string, attrs?: Attributes, content?: unknown[]): E;
export function e(tagName: string, attrs?: unknown, content?: unknown[]): Element {
	if (Array.isArray(attrs)) {
		return createElement(tagName, {}, attrs);
	}
	return createElement(tagName, attrs as Attributes ?? {}, content ?? []);
}
