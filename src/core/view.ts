import { shareInstancesOf } from "./globals.js";
import { createParent, createPlaceholder, extractRange } from "./internals.js";
import { capture, nocapture, teardown, TeardownHook } from "./lifecycle.js";
import { render } from "./render.js";
import { effect, Expression, get, memo, sig, Signal, watch } from "./signals.js";
import { Falsy } from "./types.js";

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
 * + If there are multiple nodes, all nodes must have a common parent node at all time.
 */
export class View {
	static {
		shareInstancesOf(this, "gluon:view_instance");
	}

	#first!: Node;
	#last!: Node;
	#owner: ViewBoundaryOwner | undefined;

	/**
	 * Create a new view.
	 *
	 * View implementations need to guarantee that:
	 * + The view doesn't break when the parent node is replaced or when a view consisting of only a single node is detached from it's parent.
	 * + The boundary is updated immediately after the first or last node has been updated.
	 * + If there are multiple nodes, all nodes remain in the current parent.
	 * + If there are multiple nodes, the initial nodes must have a common parent.
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
	 *
	 * Note, that this property is not reactive.
	 */
	get first(): Node {
		return this.#first;
	}

	/**
	 * The current last node of this view.
	 *
	 * Note, that this property is not reactive.
	 */
	get last(): Node {
		return this.#last;
	}

	/**
	 * The current parent node or undefined if there is none.
	 *
	 * Note, that this property is not reactive.
	 */
	get parent(): Node | undefined {
		return this.#first?.parentNode ?? undefined;
	}

	/**
	 * Set the boundary owner for this view until the current lifecycle is disposed.
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
		return extractRange(this.#first, this.#last);
	}

	/**
	 * Detach all nodes of this view from the current parent if there is one.
	 *
	 * If there are multiple nodes, they are moved into a new document fragment to allow the view implementation to stay alive.
	 */
	detach(): void {
		if (this.#first === this.#last) {
			this.#first?.parentNode?.removeChild(this.#first);
		} else {
			extractRange(this.#first, this.#last);
		}
	}
}

/**
 * Get an iterator over all current top level nodes of a view.
 *
 * @param view The view.
 * @returns The iterator.
 *
 * @example
 * ```tsx
 * import { render, viewNodes } from "@mxjp/gluon";
 *
 * const view = render(<>
 *   <h1>Hello World!</h1>
 * </>);
 *
 * for (const node of viewNodes(view)) {
 *   console.log(node);
 * }
 * ```
 */
export function * viewNodes(view: View): IterableIterator<Node> {
	let node = view.first;
	for (;;) {
		yield node;
		if (node === view.last) {
			break;
		}
		node = node.nextSibling!;
	}
}

/**
 * A component that renders content depending on an expression.
 *
 * @example
 * ```tsx
 * import { Nest, sig } from "@mxjp/gluon";
 *
 * const count = sig(0);
 *
 * <Nest>
 *   {() => {
 *     const value = count.value;
 *     return () => <>{value}</>;
 *   }}
 * </Nest>
 * ```
 */
export function Nest(props: {
	/**
	 * An expression that returns a function to create content or null or undefined to render nothing.
	 */
	children: Expression<(() => unknown) | null | undefined>;
}): View {
	return new View((setBoundary, self) => {
		watch(props.children, value => {
			const view = render(value?.());
			const parent = self.parent;
			if (parent) {
				parent.insertBefore(view.take(), self.first);
				self.detach();
			}
			setBoundary(view.first, view.last);
			view.setBoundaryOwner(setBoundary);
		}, true);
	});
}

/**
 * A component that renders conditional content.
 *
 * Content is only re-rendered if the expression result is not strictly equal to the previous one. If this behavior is undesired, use {@link Nest} instead.
 *
 * @example
 * ```tsx
 * import { sig, Show } from "@mxjp/gluon";
 *
 * const message = sig<null | string>("Hello World!");
 *
 * <Show when={message} else={() => <>No message...</>}>
 *   {value => <h1>{value}</h1>}
 * </Show>
 * ```
 */
export function Show<T>(props: {
	/**
	 * The expression to evaluate.
	 */
	when: Expression<T | Falsy>;

	/**
	 * A function to create content if the value is truthy.
	 */
	children: (value: T) => unknown;

	/**
	 * An optional function to create content if the value is falsy.
	 */
	else?: () => unknown;
}): View {
	const getValue = memo(props.when);
	return Nest({
		children: () => {
			const value = getValue();
			if (value) {
				return () => props.children(value);
			}
			return props.else;
		},
	});
}

/**
 * A function to create content for a specific value.
 */
export interface ForContentFn<T> {
	/**
	 * @param value The value.
	 * @param index An expression to get the current index.
	 * @returns The content.
	 */
	(value: T, index: () => number): unknown;
}

function insertView(parent: Node, prev: Node, view: View): void {
	const next = prev.nextSibling;
	if (next) {
		parent.insertBefore(view.take(), next);
	} else {
		parent.appendChild(view.take());
	}
}

/**
 * A component that renders content for each unique value in an iterable.
 *
 * @example
 * ```tsx
 * import { ForUnique, sig } from "@mxjp/gluon";
 *
 * const items = sig([1, 2, 3]);
 *
 * <ForUnique each={items}>
 *   {value => <li>{value}</li>}
 * </ForUnique>
 * ```
 */
export function For<T>(props: {
	/**
	 * The expression.
	 */
	each: Expression<Iterable<T>>;

	/**
	 * A function to create content for a specific value.
	 */
	children: ForContentFn<T>;
}): View {
	return new View((setBoundary, self) => {
		interface Instance {
			/** value */
			u: T;
			/** cycle */
			c: number;
			/** index */
			i: Signal<number>;
			/** dispose */
			d: TeardownHook;
			/** view */
			v: View;
		}

		function detach(instances: Instance[]) {
			for (let i = 0; i < instances.length; i++) {
				instances[i].v.detach();
			}
		}

		let cycle = 0;

		const instances: Instance[] = [];
		const instanceMap = new Map<T, Instance>();

		const first: Node = createPlaceholder();
		setBoundary(first, first);

		teardown(() => {
			for (let i = 0; i < instances.length; i++) {
				instances[i].d();
			}
		});

		effect(() => {
			let parent = self.parent;
			if (!parent) {
				parent = createParent();
				parent.appendChild(first);
			}
			let index = 0;
			let last = first;
			for (const value of nocapture(() => get(props.each))) {
				let instance: Instance | undefined = instances[index];
				if (instance && Object.is(instance.u, value)) {
					instance.c = cycle;
					instance.i.value = index;
					last = instance.v.last;
					index++;
				} else {
					instance = instanceMap.get(value);
					if (instance === undefined) {
						const instance: Instance = {
							u: value,
							c: cycle,
							i: sig(index),
							d: undefined!,
							v: undefined!,
						};

						instance.d = capture(() => {
							instance.v = render(props.children(value, () => instance.i.value));
							instance.v.setBoundaryOwner((_, last) => {
								if (instances[instances.length - 1] === instance && instance.c === cycle) {
									setBoundary(undefined, last);
								}
							});
						});

						insertView(parent, last, instance.v);
						instances.splice(index, 0, instance);
						instanceMap.set(value, instance);
						last = instance.v.last;
						index++;
					} else if (instance.c !== cycle) {
						instance.i.value = index;
						instance.c = cycle;

						const currentIndex = instances.indexOf(instance, index);
						if (currentIndex < 0) {
							detach(instances.splice(index, instances.length - index, instance));
							insertView(parent, last, instance.v);
						} else {
							detach(instances.splice(index, currentIndex - index));
						}

						last = instance.v.last;
						index++;
					}
				}
			}

			if (instances.length > index) {
				detach(instances.splice(index));
			}

			for (const [value, instance] of instanceMap) {
				if (instance.c !== cycle) {
					instanceMap.delete(value);
					instance.v.detach();
					instance.d();
				}
			}
			cycle = (cycle + 1) | 0;
			if (last !== self.last) {
				setBoundary(undefined, last);
			}
		}, true);
	});
}

/**
 * A function to create content for a specific index and value.
 */
export interface IndexForContentFn<T> {
	/**
	 * @param value The value.
	 * @param index The index.
	 * @returns The content.
	 */
	(value: T, index: number): unknown;
}

/**
 * A component that renders content for each value in an iterable, keyed by index and value.
 *
 * @example
 * ```tsx
 * import { IndexFor, sig } from "@mxjp/gluon";
 *
 * const items = sig([1, 2, 3]);
 *
 * <IndexFor each={items}>
 *   {value => <li>{value}</li>}
 * </IndexFor>
 * ```
 */
export function IndexFor<T>(props: {
	/**
	 * The expression.
	 */
	each: Expression<Iterable<T>>;

	/**
	 * A function to create content for a specific index and value.
	 */
	children: IndexForContentFn<T>;
}): View {
	return new View((setBoundary, self) => {
		interface Instance {
			/** value */
			u: T;
			/** dispose */
			d: TeardownHook;
			/** view */
			v: View;
		}

		const first: Node = createPlaceholder();
		setBoundary(first, first);

		const instances: Instance[] = [];

		effect(() => {
			let parent = self.parent;
			if (!parent) {
				parent = createParent();
				parent.appendChild(first);
			}
			let index = 0;
			let last = first;
			for (const value of nocapture(() => get(props.each))) {
				if (index < instances.length) {
					const current = instances[index];
					if (Object.is(current.u, value)) {
						last = current.v.last;
						index++;
						continue;
					}
					current.v.detach();
					current.d();
				}

				const instance: Instance = {
					u: value,
					d: undefined!,
					v: undefined!,
				};

				instance.d = capture(() => {
					instance.v = render(props.children(value, index));
					instance.v.setBoundaryOwner((_, last) => {
						if (instances[instances.length - 1] === instance) {
							setBoundary(undefined, last);
						}
					});
				});

				insertView(parent, last, instance.v);
				instances[index] = instance;
				last = instance.v.last;
				index++;
			}

			if (instances.length > index) {
				for (let i = index; i < instances.length; i++) {
					const instance = instances[i];
					instance.v.detach();
					instance.d();
				}
				instances.length = index;
			}

			if (self.last !== last) {
				setBoundary(undefined, last);
			}
		}, true);
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
					const anchor = createPlaceholder();
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
export function movable(content: unknown): MovableView {
	return new MovableView(render(content));
}

/**
 * A component that attaches or detaches content depending on an expression.
 *
 * Content is kept alive when detached.
 *
 * @example
 * ```tsx
 * import { sig, Attach } from "@mxjp/gluon";
 *
 * const showMessage = sig(true);
 *
 * <Attach when={showMessage}>
 *   <h1>Hello World!</h1>
 * </Attach>
 * ```
 */
export function Attach(props: {
	/**
	 * The expression to evaluate.
	 */
	when: Expression<boolean>;

	/**
	 * The content to attach when the expression is truthy.
	 */
	children?: unknown;
}): View {
	const inner = render(props.children);
	return Nest({
		children: () => {
			if (get(props.when)) {
				return () => inner;
			}
		},
	});
}
