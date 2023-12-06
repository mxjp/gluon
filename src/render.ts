import { teardown } from "./lifecycle.js";
import { Expression, watch } from "./signals.js";
import { View } from "./view.js";

/**
 * Create a text node that displays the result of an expression.
 *
 * Null and undefined are displayed as an empty string.
 */
export function createText(expr: Expression<unknown>): Text {
	const text = document.createTextNode("");
	watch(expr, value => {
		text.textContent = String(value ?? "");
	});
	return text;
}

/**
 * Render arbitrary content.
 *
 * Supported content types are:
 * + Null and undefined (not displayed).
 * + Arbitrarily nested arrays/fragments of content.
 * + DOM nodes (document fragments will result in undefined behavior).
 * + {@link View Views}.
 * + Anything created with gluons jsx runtime.
 * + Anything else is displayed as text.
 *
 * @param content The content to render.
 * @returns A view instance.
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
 * render(<><>"Hello"</>{" World!"}</>);
 *
 * // DOM nodes:
 * render(<h1>Hello World!</h1>);
 * render(document.createElement("input"));
 * render(document.createTextNode("Hello World!"));
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
	return new View((setBoundary, self) => {
		if (Array.isArray(content)) {
			const flat = content.flat(Infinity);
			if (flat.length > 1) {
				const parent = document.createDocumentFragment();
				for (let i = 0; i < flat.length; i++) {
					const part = flat[i];
					if (part === null || part === undefined) {
						parent.appendChild(document.createComment(" anchor "));
					} else if (part instanceof Node) {
						parent.appendChild(part);
					} else if (part instanceof View) {
						parent.appendChild(part.take());
						if (i === 0) {
							part.setBoundaryOwner((first, _) => {
								if (first !== self.first) {
									setBoundary(first, undefined);
								}
							});
						} else if (i === flat.length - 1) {
							part.setBoundaryOwner((_, last) => {
								if (last !== self.last) {
									setBoundary(undefined, last);
								}
							});
						}
					} else {
						parent.appendChild(createText(part));
					}
				}
				setBoundary(parent.firstChild!, parent.lastChild!);
				return;
			} else {
				content = flat[0];
			}
		}
		if (content === null || content === undefined) {
			const node = document.createComment(" anchor ");
			setBoundary(node, node);
		} else if (content instanceof Node) {
			setBoundary(content, content);
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
 * Render arbitrary content and append it to the specified parent until the current context is disposed.
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
 * Since the content is removed when the current context is disposed, this can also be used to temporarily append
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
 * 		{props.children}
 *     </Show>
 *   );
 *
 *   return <button $click={() => { visible.value = !visible.value; }}>
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
	teardown(() => {
		view.detach();
	});
	return view;
}
