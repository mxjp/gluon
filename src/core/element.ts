import { ContextKey, extract, wrapContext } from "./context.js";
import { createText, TagNameMap } from "./internals.js";
import { Expression, get, Signal, watch } from "./signals.js";
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

export type XMLNS = typeof HTML | typeof SVG | typeof MATHML;

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
export const XMLNS = Symbol.for("gluon:namespace") as ContextKey<XMLNS>;

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

export type RefFn<T> = (element: T) => void;
export type RefValue<T> = (RefFn<T>) | RefFn<T>[];

export type EventListener<K extends keyof HTMLElementEventMap> = (event: HTMLElementEventMap[K]) => void;

export type EventArgs<K extends keyof HTMLElementEventMap> = [
	listener: EventListener<K>,
	options?: AddEventListenerOptions,
];

/**
 * Represents an object with element attributes.
 */
export type Attributes<T extends Element> = {
	class?: ClassValue;
	style?: StyleValue;
	ref?: RefValue<T>;
} & {
	[K in keyof HTMLElementEventMap as `on:${K}`]?: EventListener<K> | EventArgs<K>;
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
 * Create an element.
 *
 * @param tagName The tag name.
 * @param attrs The attributes to set.
 * @param content The content to append.
 * @returns The element.
 */
export function createElement<K extends keyof TagNameMap>(tagName: K, attrs: Attributes<TagNameMap[K]>, content: unknown): TagNameMap[K];
export function createElement<E extends Element>(tagName: string, attrs: Attributes<E>, content: unknown): E;
export function createElement(tagName: string, attrs: Attributes<TagNameMap[keyof TagNameMap]>, content: unknown): Element {
	const elem = document.createElementNS(extract(XMLNS) ?? HTML, tagName);
	for (const name in attrs) {
		const value = attrs[name];
		if (value !== undefined) {
			if (name.startsWith("on:")) {
				let listener: EventListener<keyof HTMLElementEventMap>;
				let options: AddEventListenerOptions | undefined;
				if (Array.isArray(value)) {
					listener = (value as EventArgs<keyof HTMLElementEventMap>)[0];
					options = (value as EventArgs<keyof HTMLElementEventMap>)[1];
				} else {
					listener = value as EventListener<keyof HTMLElementEventMap>;
				}
				elem.addEventListener(name.slice(3), wrapContext(listener), options);
			} else if (name.startsWith("prop:")) {
				const prop = name.slice(5);
				watch(value, value => (elem as any)[prop] = value);
			} else if (name.startsWith("attr:")) {
				const attr = name.slice(5);
				watch(value, value => setAttr(elem, attr, value));
			} else if (name === "ref") {
				if (Array.isArray(value)) {
					value.forEach(v => (v as RefFn<Element>)(elem));
				} else {
					(value as RefFn<Element>)(elem);
				}
			} else if (name === "style") {
				const style = (elem as HTMLElement).style;
				watchStyle(value as StyleValue, (name, value) => style.setProperty(name, value ? String(value) : null));
			} else if (name === "class") {
				watch(() => getClassTokens(value as ClassValue), tokens => elem.setAttribute("class", tokens));
			} else {
				watch(value, value => setAttr(elem, name, value));
			}
		}
	}
	appendContent(elem, content);
	return elem;
}

/**
 * Shorthand for creating an element in places where JSX can't be used.
 *
 * @param tagName The tag name.
 * @param attrs Optional attributes to set.
 * @param content Content to append.
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
 *   e("div", { class: "example" }, "Hello World!"),
 * ]);
 * ```
 *
 * Note, that in the rare case of creating an element without attributes and with content which may be an arbitrary object, you should wrap the content in an array to ensure it's not used as attributes.
 * ```ts
 * e("div", [contentOfUnknownType])
 * ```
 */
export function e<K extends keyof TagNameMap>(tagName: K, content?: unknown): TagNameMap[K];
export function e<K extends keyof TagNameMap>(tagName: K, attrs?: Attributes<TagNameMap[K]>, content?: unknown): TagNameMap[K];
export function e<E extends Element>(tagName: string, content?: unknown): E;
export function e<E extends Element>(tagName: string, attrs?: Attributes<E>, content?: unknown): E;
export function e(tagName: string, attrs?: unknown, content?: unknown): Element {
	if (attrs === null || typeof attrs !== "object" || attrs instanceof Signal || attrs instanceof View || Array.isArray(attrs)) {
		return createElement(tagName, {}, attrs);
	}
	return createElement(tagName, attrs ?? {}, content ?? []);
}
