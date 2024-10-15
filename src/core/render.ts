import { createParent, createPlaceholder, createText } from "./internals.js";
import { teardown } from "./lifecycle.js";
import { View, ViewSetBoundaryFn } from "./view.js";

/**
 * Internal shorthand for creating the boundary comment of an empty view.
 */
function empty(setBoundary: ViewSetBoundaryFn): void {
	const node = createPlaceholder();
	setBoundary(node, node);
}

/**
 * Internal shorthand for using the children of a node as boundary.
 */
function use(setBoundary: ViewSetBoundaryFn, node: Node): void {
	if (node.firstChild === null) {
		empty(setBoundary);
	} else {
		setBoundary(node.firstChild, node.lastChild!);
	}
}

/**
 * Render arbitrary content.
 *
 * Supported content types are:
 * + Null and undefined (not displayed).
 * + Arbitrarily nested arrays/fragments of content.
 * + DOM nodes. Children will be removed from document fragments.
 * + {@link View Views}.
 * + Anything created with gluons jsx runtime.
 * + Anything else is displayed as text.
 *
 * @param content The content to render.
 * @returns A view instance or the content itself if it's already a view.
 *
 * @example
 * ```tsx
 * import { render, sig } from "@mxjp/gluon";
 *
 * // Not displayed:
 * render(null);
 * render(undefined);
 *
 * // Arbitrarily nested arrays/fragments of content:
 * render([["Hello"], " World!"]);
 * render(<>{<>"Hello"</>}{" World!"}</>);
 *
 * // DOM nodes:
 * render(<h1>Hello World!</h1>);
 * render(document.createElement("input"));
 * render(document.createTextNode("Hello World!"));
 * render(someTemplate.content.cloneNode(true));
 *
 * // Views:
 * render(render("Hello World!"));
 * render(when(true, () => "Hello World!"));
 * render(<When value={true}>{() => "Hello World!"}</When>);
 *
 * // Text:
 * render("Hello World!");
 * render(() => "Hello World!");
 * render(42);
 * render(sig(42));
 * ```
 */
export function render(content: unknown): View {
	if (content instanceof View) {
		return content;
	}
	return new View(setBoundary => {
		if (Array.isArray(content)) {
			const flat = content.flat(Infinity) as unknown[];
			if (flat.length > 1) {
				const parent = createParent();
				let firstNode = 0;
				let lastNode = flat.length - 1;
				let firstView: number | undefined = undefined;
				let lastView: number | undefined = undefined;
				parts: for (let i = 0; i < flat.length; i++) {
					const part = flat[i];
					if (part instanceof Node) {
						if (part.nodeName === "#document-fragment" && part.childNodes.length === 0) {
							if (firstNode === i) {
								firstNode++;
							}
							continue parts;
						}
						parent.appendChild(part);
					} else if (part instanceof View) {
						parent.appendChild(part.take());
						firstView ??= i;
						lastView = i;
					} else if (part !== null && part !== undefined) {
						parent.appendChild(createText(part));
					}
					lastNode = i;
				}
				if (firstNode === firstView) {
					if (firstNode === lastNode) {
						(flat[firstView] as View).setBoundaryOwner(setBoundary);
					} else {
						(flat[firstView] as View).setBoundaryOwner((first, _) => setBoundary(first, undefined));
					}
				}
				if (lastNode === lastView && firstNode !== lastNode) {
					(flat[lastView] as View).setBoundaryOwner((_, last) => setBoundary(undefined, last));
				}
				use(setBoundary, parent);
				return;
			}
			content = flat[0];
		}
		if (content === null || content === undefined) {
			empty(setBoundary);
		} else if (content instanceof Node) {
			if (content.nodeName === "#document-fragment") {
				use(setBoundary, content);
			} else {
				setBoundary(content, content);
			}
		} else if (content instanceof View) {
			setBoundary(content.first, content.last);
			content.setBoundaryOwner(setBoundary);
		} else {
			const text = createText(content);
			setBoundary(text, text);
		}
	});
}

/**
 * Render arbitrary content and append it to the specified parent until the current lifecycle is disposed.
 *
 * @param parent The parent node.
 * @param content The content to render. See {@link render} for supported types.
 * @returns The view instance.
 *
 * @example
 * ```tsx
 * import { mount } from "@mxjp/gluon";
 *
 * mount(
 *   document.body,
 *   <h1>Hello World!</h1>
 * );
 * ```
 *
 * Since the content is removed when the current lifecycle is disposed, this can also be used to temporarily append
 * content to different elements while some component is rendered:
 * ```tsx
 * import { mount } from "@mxjp/gluon";
 *
 * function Popover(props: { text: unknown, children: unknown }) {
 *   const visible = sig(false);
 *
 *   mount(
 *     document.body,
 *     <Show when={visible}>
 *       {props.children}
 *     </Show>
 *   );
 *
 *   return <button on:click={() => { visible.value = !visible.value; }}>
 *     {props.text}
 *   </button>;
 * }
 *
 * mount(
 *   document.body,
 *   <Popover text="Click me!">
 *     Hello World!
 *   </Popover>
 * );
 * ```
 */
export function mount(parent: Node, content: unknown): View {
	const view = render(content);
	parent.appendChild(view.take());
	teardown(() => view.detach());
	return view;
}
