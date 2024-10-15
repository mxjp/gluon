import { extract, wrapContext } from "./context.js";
import { ClassValue, EventArgs, EventListener, HTML, StyleValue, XMLNS } from "./element-common.js";
import { appendContent, getClassTokens, setAttr, TagNameMap, watchStyle } from "./internals.js";
import { Expression, Signal, watch } from "./signals.js";
import { View } from "./view.js";

export type RefFn<T> = (element: T) => void;
export type RefValue<T> = (RefFn<T>) | RefFn<T>[];

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
				setAttr(elem, attr, value);
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
				setAttr(elem, name, value);
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
