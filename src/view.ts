import { teardown } from "./lifecycle.js";
import { render } from "./render.js";
import { Expression, get, skipEqual, watch } from "./signals.js";

export type ViewBoundaryOwner = (first: Node, last: Node) => void;
export type ViewSetBoundaryFn = (first: Node | undefined, last: Node | undefined) => void;
export type ViewInitFn = (setBoundary: ViewSetBoundaryFn, self: View) => void;

export class View {
	#first!: Node;
	#last!: Node;
	#owner: ViewBoundaryOwner | undefined;

	constructor(init: ViewInitFn) {
		init((first, last) => {
			if (first) {
				this.#first = first;
			}
			if (last) {
				this.#last = last;
			}
			this.#owner?.(this.#first, this.#last);
		}, this);
		if (!this.#first || !this.#last) {
			throw new Error("incomplete boundary");
		}
	}

	get first(): Node {
		return this.#first;
	}

	get last(): Node {
		return this.#last;
	}

	get parent(): Node | undefined {
		return this.#first?.parentNode ?? undefined;
	}

	setBoundaryOwner(owner: ViewBoundaryOwner): void {
		if (this.#owner !== undefined) {
			throw new Error("boundary owner is already set");
		}
		this.#owner = owner;
		teardown(() => {
			this.#owner = undefined;
		});
	}

	take(): Node | DocumentFragment {
		if (this.#first === this.#last) {
			return this.#first;
		}
		const range = new Range();
		range.setStartBefore(this.#first);
		range.setEndAfter(this.#last);
		return range.extractContents();
	}

	detach(): void {
		if (this.#first === this.#last) {
			this.#first.parentNode?.removeChild(this.#first);
		} else {
			const range = new Range();
			range.setStartBefore(this.#first);
			range.setEndAfter(this.#last);
			range.extractContents();
		}
	}
}

export function nest(expr: Expression<(() => unknown) | undefined>): View {
	return new View((setBoundary, self) => {
		watch(expr, value => {
			const view = render(value?.());
			const parent = self.parent;
			if (parent) {
				parent.insertBefore(view.take(), self.first);
				self.detach();
			}
			setBoundary(view.first, view.last);
			view.setBoundaryOwner(setBoundary);
		});
	});
}

type Falsy = null | undefined | false | 0 | 0n | "";

export function when<T>(expr: Expression<T | Falsy>, truthy: (value: T) => unknown, falsy?: () => unknown) {
	const getValue = skipEqual(expr);
	return nest(() => {
		const value = getValue();
		if (value) {
			return () => truthy(value);
		} else {
			return falsy;
		}
	});
}
