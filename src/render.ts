import { Expression, watch } from "./signals.js";
import { View } from "./view.js";

export function createText(expr: Expression<unknown>) {
	const text = document.createTextNode("");
	watch(expr, value => {
		text.textContent = String(value ?? "");
	});
	return text;
}

export function render(content: unknown): View {
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

export function mount(parent: Node, content: unknown): View {
	const view = render(content);
	parent.appendChild(view.take());
	return view;
}
