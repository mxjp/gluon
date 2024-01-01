import { extract, inject, wrapContext } from "./context.js";
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
 * import { mount, XMLNS, SVG, Inject, inject, e } from "@mxjp/gluon";
 *
 * mount(
 *   document.body,
 *   <>
 *     <Inject key={XMLNS} value={SVG}>
 *       {() => <svg>...</svg>}
 *     </Inject>
 *
 *     {inject([XMLNS, SVG], () => {
 *       return e("svg", [...]);
 *     })}
 *   </>
 * );
 * ```
 */
export const XMLNS = Symbol("namespace");

/**
 * @deprecated Use {@link inject} with {@link XMLNS} directly.
 */
export function useNamespace<T>(ns: string, fn: () => T): T {
	return inject([XMLNS, ns], fn);
}

/**
 * Append content to a node.
 *
 * @param node The node.
 * @param content The content to append.
 */
export function appendContent(node: Node, content: unknown) {
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

type EventAttributes = {
	[K in keyof HTMLElementEventMap as `$${K}` | `$$${K}`]?: (event: HTMLElementEventMap[K]) => void;
};

export type ClassValue = Expression<undefined | null | false | string | Record<string, Expression<boolean>> | ClassValue[]>;

type SpecialAttributes = {
	class?: ClassValue;
	style?: Expression<string> | {
		[K in keyof CSSStyleDeclaration]?: Expression<CSSStyleDeclaration[K]>;
	};
};

type OtherAttributes = {
	[K in Exclude<string, keyof EventAttributes>]: Expression<unknown>;
};

/**
 * Represents an object with element attributes.
 */
export type Attributes = EventAttributes & SpecialAttributes & OtherAttributes;

function isProp(obj: object, name: string): boolean {
	if (name in obj) {
		while (obj) {
			const desc = Object.getOwnPropertyDescriptor(obj, name);
			if (desc) {
				return Boolean(desc.writable || desc.set);
			}
			obj = Object.getPrototypeOf(obj);
		}
	}
	return false;
}

function setAttr(elem: Element, name: string, value: unknown, prop: boolean): void {
	if (prop) {
		(elem as Record<string, any>)[name] = value;
	} else if (value === null || value === undefined) {
		elem.removeAttribute(name);
	} else {
		elem.setAttribute(name, value as string);
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
	} else {
		return "";
	}
}

/**
 * Set attributes on an element.
 *
 * @param elem The element.
 * @param attrs The attributes to set.
 * @param jsx True if the element is created by the jsx runtime.
 */
export function setAttributes(elem: Element, attrs: Attributes, jsx: boolean): void {
	attrs: for (const name in attrs) {
		if (jsx && name === "children") {
			continue attrs;
		}
		const value = attrs[name as keyof Attributes];
		if (name.startsWith("$")) {
			const capture = name.startsWith("$$");
			const event = name.slice(capture ? 2 : 1);
			elem.addEventListener(event, wrapContext(value as (event: Event) => void), { capture });
		} else {
			switch (name) {
				case "style":
					if (value !== null && typeof value === "object") {
						for (const prop in value) {
							if (prop.startsWith("--")) {
								watch(value[prop as never], value => {
									(elem as HTMLElement).style.setProperty(prop, value);
								});
							} else {
								watch(value[prop as never], value => {
									(elem as HTMLElement).style[prop as never] = value;
								});
							}
						}
						continue attrs;
					}
					break;

				case "class":
					watch(() => getClassTokens(value as ClassValue), tokens => {
						elem.setAttribute("class", tokens);
					});
					continue attrs;
			}

			const prop = isProp(elem, name);
			watch(value, value => setAttr(elem, name, value, prop));
		}
	}
}

/**
 * Create an element.
 *
 * @param tagName The tag name.
 * @param attrs The attributes to set.
 * @param content The content to append.
 * @param jsx True if the element is created by the jsx runtime.
 * @returns The element.
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, attrs: Attributes, content: unknown[], jsx: boolean): HTMLElementTagNameMap[K];
export function createElement<K extends keyof SVGElementTagNameMap>(tagName: K, attrs: Attributes, content: unknown[], jsx: boolean): SVGElementTagNameMap[K];
export function createElement<K extends keyof MathMLElementTagNameMap>(tagName: K, attrs: Attributes, content: unknown[], jsx: boolean): MathMLElementTagNameMap[K];
export function createElement<E extends Element>(tagName: string, attrs: Attributes, content: unknown[], jsx: boolean): E;
export function createElement(tagName: string, attrs: Attributes, content: unknown[], jsx: boolean): Element {
	const ns = (extract(XMLNS) as string);
	const elem = ns === undefined
		? document.createElement(tagName)
		: document.createElementNS(ns, tagName) as HTMLElement | SVGElement | MathMLElement;

	setAttributes(elem, attrs, jsx);
	appendContent(elem, content);
	return elem;
}

/**
 * Create an element.
 *
 * @param tagName The tag name.
 * @param attrs The attributes to set.
 * @param content The content to append.
 * @returns The element.
 *
 * @example
 * ```ts
 * import { mount, e } from "@mxjp/gluon";
 *
 * mount(
 *   document.body,
 *   // Element with content only:
 *   e("div", [
 *     // Element with attributes only:
 *     e("div", { class: "example" }),
 *
 *     // Element with attributes and content:
 *     e("div", { class: "example" }, [
 *       "Hello World!",
 *     ]),
 *   ]),
 * );
 * ```
 */
export function e<K extends keyof HTMLElementTagNameMap>(tagName: K): HTMLElementTagNameMap[K];
export function e<K extends keyof HTMLElementTagNameMap>(tagName: K, attrs: Attributes): HTMLElementTagNameMap[K];
export function e<K extends keyof HTMLElementTagNameMap>(tagName: K, content: unknown[]): HTMLElementTagNameMap[K];
export function e<K extends keyof HTMLElementTagNameMap>(tagName: K, attrs: Attributes, content: unknown[]): HTMLElementTagNameMap[K];
export function e<K extends keyof SVGElementTagNameMap>(tagName: K): SVGElementTagNameMap[K];
export function e<K extends keyof SVGElementTagNameMap>(tagName: K, attrs: Attributes): SVGElementTagNameMap[K];
export function e<K extends keyof SVGElementTagNameMap>(tagName: K, content: unknown[]): SVGElementTagNameMap[K];
export function e<K extends keyof SVGElementTagNameMap>(tagName: K, attrs: Attributes, content: unknown[]): SVGElementTagNameMap[K];
export function e<K extends keyof MathMLElementTagNameMap>(tagName: K): MathMLElementTagNameMap[K];
export function e<K extends keyof MathMLElementTagNameMap>(tagName: K, attrs: Attributes): MathMLElementTagNameMap[K];
export function e<K extends keyof MathMLElementTagNameMap>(tagName: K, content: unknown[]): MathMLElementTagNameMap[K];
export function e<K extends keyof MathMLElementTagNameMap>(tagName: K, attrs: Attributes, content: unknown[]): MathMLElementTagNameMap[K];
export function e<E extends Element>(tagName: string): E;
export function e<E extends Element>(tagName: string, attrs: Attributes): E;
export function e<E extends Element>(tagName: string, content: unknown[]): E;
export function e<E extends Element>(tagName: string, attrs: Attributes, content: unknown[]): E;
export function e(tagName: string, attrs?: unknown, content?: unknown[]): Element {
	if (Array.isArray(attrs)) {
		return createElement(tagName, {}, attrs, false);
	} else {
		return createElement(tagName, attrs as Attributes ?? {}, content ?? [], false);
	}
}
