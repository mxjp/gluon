import { render } from "./render.js";
import { TeardownHook, capture, teardown } from "./lifecycle.js";
import { Expression, Signal, get, sig, skipEqual, watch } from "./signals.js";

/**
 * A function that is called when the view boundary may have been changed.
 */
export interface ViewBoundaryOwner {
	/**
	 * @param first The current first node.
	 * @param last The current last node.
	 */
	(first: Node, last: Node): void;
}

/**
 * A function that must be called after the view boundary has been changed.
 */
export interface ViewSetBoundaryFn {
	/**
	 * @param first The first node if changed.
	 * @param last The last node if changed.
	 */
	(first: Node | undefined, last: Node | undefined): void;
}

/**
 * A function that is called once to initialize a view instance.
 *
 * View creation will fail if no first or last node has been set during initialization.
 */
export interface ViewInitFn {
	/**
	 * @param setBoundary A function that must be called after the view boundary has been changed.
	 * @param self The current view itself. This can be used to keep track of the current boundary and parent nodes.
	 */
	(setBoundary: ViewSetBoundaryFn, self: View): void;
}

/**
 * Represents a sequence of at least one DOM node.
 *
 * Consumers of the view API need to guarantee that:
 * + The sequence of nodes is not modified from the outside.
 * + If there are multiple nodes, all nodes must have a single parent node.
 */
export class View {
	#first!: Node;
	#last!: Node;
	#owner: ViewBoundaryOwner | undefined;

	/**
	 * Create a new view.
	 *
	 * View implementations need to guarantee that:
	 * + The view doesn't break if the parent is replaced from the outside.
	 * + The boundary is updated when the first or last node has been replaced.
	 * + If there are multiple nodes, all nodes remain in the current parent.
	 * + If there are multiple nodes, the initial nodes must have a parent.
	 */
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

	/**
	 * The current first node of this view.
	 */
	get first(): Node {
		return this.#first;
	}

	/**
	 * The current last node of this view.
	 */
	get last(): Node {
		return this.#last;
	}

	/**
	 * The current parent node or undefined if there is none.
	 */
	get parent(): Node | undefined {
		return this.#first?.parentNode ?? undefined;
	}

	/**
	 * Set the boundary owner for this view until the current context is disposed.
	 *
	 * @throws An error if there currently is a boundary owner.
	 */
	setBoundaryOwner(owner: ViewBoundaryOwner): void {
		if (this.#owner !== undefined) {
			throw new Error("boundary owner is already set");
		}
		this.#owner = owner;
		teardown(() => {
			this.#owner = undefined;
		});
	}

	/**
	 * Get all nodes of this view as a single node for moving them into a new place.
	 *
	 * If there are multiple nodes, a document fragment containing all nodes of this view is returned.
	 */
	take(): Node | DocumentFragment {
		if (this.#first === this.#last) {
			return this.#first;
		}
		const range = new Range();
		range.setStartBefore(this.#first);
		range.setEndAfter(this.#last);
		return range.extractContents();
	}

	/**
	 * Detach all nodes of this view from the current parent if there is one.
	 *
	 * If there are multiple nodes, they are moved into a new document fragment to allow the view implementation to stay alive.
	 */
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

/**
 * Create a view that renders content depending on an expression.
 *
 * @param expr An expression that returns a function to create content or null or undefined to render nothing.
 * @returns The view.
 */
export function nest(expr: Expression<(() => unknown) | null | undefined>): View {
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

/**
 * Create a view that renders conditional content.
 *
 * @param expr The expression.
 * @param truthy A function to create content if the expression result is truthy.
 * @param falsy An optional function to create content if the expression is falsy.
 * @returns The view.
 */
export function when<T>(expr: Expression<T | Falsy>, truthy: (value: T) => unknown, falsy?: () => unknown): View {
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

/**
 * A function to create content for a specific value.
 */
export interface MapContentFn<T> {
	/**
	 * @param value The value.
	 * @param index An expression to get the current index.
	 * @returns The content.
	 */
	(value: T, index: () => number): unknown;
}

/**
 * Create a view that renders content for each unique value from an interable.
 *
 * Content instances are keyed by value.
 *
 * @param expr The expression.
 * @param content The function to create content for a specific value.
 * @returns The view.
 */
export function map<T>(expr: Expression<Iterable<T>>, content: MapContentFn<T>): View {
	return new View((setBoundary, self) => {
		interface Instance {
			value: T;
			cycle: number;
			index: Signal<number>;
			dispose: TeardownHook;
			view: View;
		}

		function detach(instances: Instance[]) {
			for (let i = 0; i < instances.length; i++) {
				instances[i].view.detach();
			}
		}

		let cycle = 0;

		const instances: Instance[] = [];
		const instanceMap = new Map<T, Instance>();

		const first: Node = document.createComment(" map ");
		setBoundary(first, first);

		teardown(() => {
			for (let i = 0; i < instances.length; i++) {
				instances[i].dispose();
			}
		});

		watch(expr, values => {
			let parent = self.parent;
			if (!parent) {
				parent = document.createDocumentFragment();
				parent.appendChild(first);
			}
			let index = 0;
			let last = first;
			for (const value of values) {
				let instance: Instance | undefined = instances[index];
				if (instance && instance.value === value) {
					instance.cycle = cycle;
					instance.index.value = index;
					last = instance.view.last;
					index++;

				} else {
					instance = instanceMap.get(value);
					if (instance === undefined) {
						const instance: Instance = {
							value,
							cycle,
							index: sig(index),
							dispose: undefined!,
							view: undefined!,
						};

						instance.dispose = capture(() => {
							instance.view = render(content(value, () => instance.index.value));
							instance.view.setBoundaryOwner((_, last) => {
								if (instances[instances.length - 1] === instance && instance.cycle === cycle) {
									setBoundary(undefined, last);
								}
							});
						});

						const next = last.nextSibling;
						if (next) {
							parent.insertBefore(instance.view.take(), next);
						} else {
							parent.appendChild(instance.view.take());
						}

						instances.splice(index, 0, instance);
						instanceMap.set(value, instance);
						last = instance.view.last;
						index++;

					} else if (instance.cycle !== cycle) {
						instance.index.value = index;
						instance.cycle = cycle;

						const currentIndex = instances.indexOf(instance, index);
						if (currentIndex < 0) {
							// TODO: Check if performance is better when detaching is skipped here:
							detach(instances.splice(index, instances.length - index, instance));
							const next = last.nextSibling;
							if (next) {
								parent.insertBefore(instance.view.take(), next);
							} else {
								parent.appendChild(instance.view.take());
							}
						} else {
							detach(instances.splice(index, currentIndex - index));
						}

						last = instance.view.last;
						index++;
					}
				}
			}

			if (instances.length > index) {
				detach(instances.splice(index));
			}

			for (const [value, instance] of instanceMap) {
				if (instance.cycle !== cycle) {
					instanceMap.delete(value);
					instance.view.detach();
					instance.dispose();
				}
			}
			cycle++;
			if (last !== self.last) {
				setBoundary(undefined, last);
			}
		});
	});
}

/**
 * A function to create content for a specific index and value.
 */
export interface IterContentFn<T> {
	/**
	 * @param value The value.
	 * @param index The index.
	 * @returns The content.
	 */
	(value: T, index: number): unknown;
}

/**
 * Create a view that renders content for each value from an iterable.
 *
 * Content instances are keyed by index and value.
 *
 * @param expr The expression.
 * @param content The function to create content for a specific index and value.
 * @returns The view.
 */
export function iter<T>(expr: Expression<Iterable<T>>, content: (value: T, index: number) => unknown): View {
	return new View((setBoundary, self) => {
		interface Instance {
			value: T;
			dispose: TeardownHook;
			view: View;
		}

		const first: Node = document.createComment(" iter ");
		setBoundary(first, first);

		const instances: Instance[] = [];

		watch(expr, values => {
			let parent = self.parent;
			if (!parent) {
				parent = document.createDocumentFragment();
				parent.appendChild(first);
			}
			let index = 0;
			let last = first;
			for (const value of values) {
				if (index < instances.length) {
					const current = instances[index];
					if (current.value === value) {
						last = current.view.last;
						index++;
						continue;
					}
					current.view.detach();
					current.dispose();
				}

				const instance: Instance = {
					value,
					dispose: undefined!,
					view: undefined!,
				};

				instance.dispose = capture(() => {
					instance.view = render(content(value, index));
					instance.view.setBoundaryOwner((_, last) => {
						if (instances[instances.length - 1] === instance) {
							setBoundary(undefined, last);
						}
					});
				});

				const next = last.nextSibling;
				if (next) {
					parent.insertBefore(instance.view.take(), next);
				} else {
					parent.appendChild(instance.view.take());
				}

				instances[index] = instance;
				last = instance.view.last;
				index++;
			}

			if (instances.length > index) {
				for (let i = index; i < instances.length; i++) {
					const instance = instances[i];
					instance.view.detach();
					instance.dispose();
				}
				instances.length = index;
			}

			if (self.last !== last) {
				setBoundary(undefined, last);
			}
		});
	});
}

/**
 * A wrapper that can be used for moving and reusing views.
 */
export class MovableView {
	#view: View;
	#dispose?: TeardownHook = undefined;

	constructor(view: View) {
		this.#view = view;
	}

	/**
	 * Create a new view that contains the wrapped view until it is moved again or detached.
	 */
	move(): View {
		return new View((setBoundary, self) => {
			this.#dispose?.();
			this.#dispose = capture(() => {
				setBoundary(this.#view.first, this.#view.last);
				this.#view.setBoundaryOwner(setBoundary);
				teardown(() => {
					const anchor = document.createComment(" moved ");
					const parent = self.parent;
					if (parent) {
						parent.insertBefore(anchor, self.first);
						self.detach();
					}
					setBoundary(anchor, anchor);
				});
			});
		});
	}

	/**
	 * Detach the wrapped view if attached.
	 */
	detach(): void {
		this.#dispose?.();
		this.#dispose = undefined;
	}
}

/**
 * Render and wrap arbitrary content so that it can be moved and reused.
 */
export function movable(content: unknown) {
	return new MovableView(render(content));
}

/**
 * Render content and attach it to the tree depending on an expression.
 */
export function show(expr: Expression<boolean>, content: unknown): View {
	const inner = render(content);
	const show = skipEqual(() => Boolean(get(expr)));
	return nest(() => {
		return show()
			? () => inner
			: () => document.createComment(" hidden ");
	});
}
