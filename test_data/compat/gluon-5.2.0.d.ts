
/**
 * Utility for defining phantom typed context key-value pairs.
 *
 * @example
 * ```ts
 * import { ContextKey } from "@mxjp/gluon";
 *
 * const key = Symbol("example") as SymbolFor<"exampleValue">;
 *
 * inject(key, "exampleValue", () => {
 *   const value = extract(key); // type = "exampleValue"
 * });
 * ```
 */
type ContextKey<V> = symbol & {
	PHANTOM_CONTEXT_KEY_FOR: V & never;
};
/**
 * The value type for a specific type of key.
 */
type ContextValue<K> = K extends ContextKey<infer V> ? V : unknown;
/**
 * Interface for a context that should not be modified.
 *
 * Note that this is always a {@link Map} instance.
 */
interface ReadonlyContext {
	get<K>(key: K): ContextValue<K> | undefined;
	has(key: unknown): boolean;
	readonly size: number;
}
/**
 * Interface for a context that may be modified.
 *
 * Note that this is always a {@link Map} instance.
 */
interface Context extends ReadonlyContext {
	clear(): void;
	delete(key: unknown): boolean;
	set<K>(key: K, value: ContextValue<K>): void;
}
/**
 * Get the current context.
 *
 * @returns The current context or undefined if there is no context.
 */
declare function getContext(): ReadonlyContext | undefined;
/**
 * Get a value from the current context.
 *
 * @param key The key to find.
 * @returns The value or undefined if not found.
 */
declare function extract<K>(key: K): ContextValue<K> | undefined;
/**
 * Run a function within a copy of the current context that also contains an additional entry.
 *
 * For injecting multiple entries prefer using {@link deriveContext}.
 *
 * @param value The key value pair or instance to inject.
 * @param fn The function to run.
 * @returns The function's return value.
 */
declare function inject<K, R>(key: K, value: ContextValue<K>, fn: () => R): R;
/**
 * Run a function within a copy of the current context.
 *
 * @param fn The function to run.
 * @returns The function's return value.
 */
declare function deriveContext<R>(fn: (context: Context, parent?: ReadonlyContext) => R): R;
/**
 * Run a function within the specified or without a context.
 *
 * @param context The context or undefined to use no context.
 * @param fn The function to run.
 * @returns The function's return value.
 */
declare function runInContext<R>(context: ReadonlyContext | undefined, fn: () => R): R;
/**
 * Wrap a function to be run with the current context.
 *
 * @param fn The function to wrap.
 * @returns The wrapper.
 */
declare function wrapContext<T extends (...args: any) => any>(fn: T): T;

/**
 * A function used in signals to determine if the signal should update during a value assignment.
 */
interface SignalEqualsFn<T> {
	/**
	 * @param previous The previous value.
	 * @param current The current value.
	 * @returns False to update.
	 */
	(previous: T, current: T): boolean;
}
/**
 * Represents a value that changes over time.
 */
declare class Signal<T> {
	#private;
	/**
	 * Create a new signal.
	 *
	 * @param value The initial value.
	 * @param equals True to skip updates when an assigned value is strictly equal to the previous one or a function to determine of the values are equal. Default is true.
	 */
	constructor(value: T, equals?: SignalEqualsFn<T> | boolean);
	/**
	 * Access the current value.
	 */
	get value(): T;
	/**
	 * Set the current value.
	 *
	 * @example
	 * ```tsx
	 * import { sig, watch } from "@mxjp/gluon";
	 *
	 * const count = sig(0);
	 *
	 * watch(count, count => {
	 *   console.log("Count:", count);
	 * });
	 *
	 * count.value++;
	 * ```
	 */
	set value(value: T);
	/**
	 * Update the current value in place.
	 *
	 * @param fn A function to update the value. If false is returned, dependants are not notified.
	 *
	 * @example
	 * ```tsx
	 * import { sig, watch } from "@mxjp/gluon";
	 *
	 * const items = sig([]);
	 *
	 * watch(items, items => {
	 *   console.log("Items:", items);
	 * });
	 *
	 * items.update(items => {
	 *   items.push("foo");
	 *   items.push("bar");
	 * });
	 * ```
	 */
	update(fn: (value: T) => void | boolean): void;
	/**
	 * Manually access this signal.
	 */
	access(): void;
	/**
	 * Manually notify dependants.
	 */
	notify(): void;
}
/**
 * Create a new signal.
 *
 * @param value The initial value.
 * @param equals True to skip updates when an assigned value is strictly equal to the previous one or a function to determine if the values are equal. Default is true.
 * @returns The signal.
 */
declare function sig(): Signal<void>;
declare function sig<T>(value: T, equals?: SignalEqualsFn<T> | boolean): Signal<T>;
/**
 * A value, signal or function to get a value.
 *
 * @example
 * ```tsx
 * import { sig, watch } from "@mxjp/gluon";
 *
 * const message = sig("Example");
 *
 * // Not reactive:
 * watch(message.value, message => {
 *   console.log("A:", message);
 * });
 *
 * // Reactive:
 * watch(message, message => {
 *   console.log("B:", message);
 * });
 *
 * // Reactive:
 * watch(() => message.value, message => {
 *   console.log("C:", message);
 * });
 *
 * message.value = "Hello World!";
 * ```
 */
type Expression<T> = T | Signal<T> | (() => T);
/**
 * Type for the result of an expression.
 */
type ExpressionResult<T> = T extends Expression<infer R> ? R : never;
/**
 * Watch an expression until the current lifecycle is disposed.
 *
 * @param expr The expression to watch.
 * @param fn The function to call with the expression result. This is guaranteed to be called at least once immediately.
 * @param trigger If true, {@link batch batches} are ignored and the callback is guaranteed to be called before all other non-trigger callbacks. This can be used to implement computations that can run during batches.
 *
 * @example
 * ```tsx
 * import { sig, watch } from "@mxjp/gluon";
 *
 * const count = sig(0);
 *
 * // Capture teardown hooks registered by "watch":
 * const dispose = capture(() => {
 *   // Start watching:
 *   watch(count, count => {
 *     console.log("Count:", count);
 *   });
 * });
 *
 * count.value = 1;
 *
 * // Stop watching:
 * dispose();
 *
 * count.value = 2;
 * ```
 */
declare function watch<T>(expr: Expression<T>, fn: (value: T) => void, trigger?: boolean): void;
/**
 * Evaluate an expression and call a function once when any accessed signals are updated.
 *
 * It is guaranteed that all triggers are called before other non-trigger dependants per signal update or batch.
 *
 * @param expr The expression evaluate.
 * @param fn The function to call when any accessed signals are updated.
 * @param cycle An arbitrary number to pass back to the function.
 *
 * @example
 * ```tsx
 * import { sig, trigger } from "@mxjp/gluon";
 *
 * const count = sig(0);
 *
 * console.log("Count:", trigger(count, cycle => {
 *   console.log("Count is being updated:", cycle);
 * }, 42));
 *
 * count.value++;
 * ```
 */
declare function trigger<T>(expr: Expression<T>, fn: (cycle: number) => void, cycle?: number): T;
/**
 * Defer signal updates while calling a function and call the immediately after the function returns.
 *
 * @param fn The function to run.
 * @returns The function's return value.
 *
 * @example
 * ```tsx
 * import { batch, sig, watch } from "@mxjp/gluon";
 *
 * const a = sig(2);
 * const b = sig(3);
 *
 * watch(() => a.value + b.value, value => {
 *   console.log("Sum:", value);
 * });
 *
 * batch(() => {
 *   a.value = 4;
 *   b.value = 5;
 * });
 * ```
 */
declare function batch<T>(fn: () => T): T;
/**
 * Watch an expression and create a function to reactively access it's latest result.
 *
 * This is similar to {@link lazy}, but the expression is also evaluated if it isn't used and during batches.
 *
 * @param expr The expression to watch.
 * @param equals True to skip updates when a result is strictly equal to the previous one or a function to determine if the results are equal. Default is true.
 * @returns A function to access the latest result.
 *
 * @example
 * ```ts
 * import { sig, memo, watch } from "@mxjp/gluon";
 *
 * const count = sig(42);
 *
 * const memoized = memo(() => count.value);
 *
 * watch(memoized, count => {
 *   console.log("Count:", count);
 * });
 * ```
 */
declare function memo<T>(expr: Expression<T>, equals?: SignalEqualsFn<T> | boolean): () => T;
/**
 * Wrap an expression to be evaulated only when any of the accessed signals have been updated.
 *
 * This is similar to {@link memo}, but the expression is only evaulated if it is used.
 *
 * @param expr The expression to wrap.
 * @returns A function to lazily evaluate the expression.
 */
declare function lazy<T>(expr: Expression<T>): () => T;
/**
 * Run a function while not tracking signal accesses.
 *
 * This is the opposite of {@link track}.
 *
 * @param fn The function to run.
 * @returns The function's return value.
 *
 * @example
 * ```tsx
 * import { sig, untrack, watch } from "@mxjp/gluon";
 *
 * const a = sig(2);
 * const b = sig(3);
 *
 * watch(() => a.value + untrack(() => b.value), sum => {
 *   console.log("Sum:", sum);
 * });
 *
 * a.value = 4;
 * b.value = 5;
 * ```
 */
declare function untrack<T>(fn: () => T): T;
/**
 * Run a function while tracking signal accesses. This is the default behavior.
 *
 * This is the opposite of {@link untrack}.
 *
 * @param fn The function to run.
 * @returns The function's return value.
 */
declare function track<T>(fn: () => T): T;
/**
 * Evaulate an expression.
 *
 * This can be used to access reactive and non reactive inputs.
 *
 * @param expr The expression to evaluate.
 * @returns The expression result.
 *
 * @example
 * ```tsx
 * import { sig, get } from "@mxjp/gluon";
 *
 * const count = sig(42);
 *
 * get(42) // 42
 * get(count) // 42
 * get(() => 42) // 42
 * ```
 */
declare function get<T>(expr: Expression<T>): T;
type MapFn<I, O> = (input: I) => O;
/**
 * Map an expression value while preserving if the expression is static or not.
 */
declare function map<I, O>(input: Expression<I>, mapFn: MapFn<I, O>): Expression<O>;
/**
 * Map an expression value to strings.
 *
 * See {@link map}.
 */
declare function string(input: Expression<unknown>): Expression<string>;
/**
 * Map an expression value to strings unless it's null or undefined.
 *
 * See {@link map}.
 */
declare function optionalString<T>(input: Expression<T>): Expression<string | Exclude<T, Exclude<T, null | undefined>>>;

/**
 * Namespace URI for HTML elements.
 */
declare const HTML = "http://www.w3.org/1999/xhtml";
/**
 * Namespace URI for SVG elements.
 */
declare const SVG = "http://www.w3.org/2000/svg";
/**
 * Namespace URI for MathML elements.
 */
declare const MATHML = "http://www.w3.org/1998/Math/MathML";
/**
 * Key for setting the namespace URI for newly created elements.
 *
 * @example
 * ```tsx
 * import { mount, XMLNS, SVG, Inject } from "@mxjp/gluon";
 *
 * mount(
 *   document.body,
 *   <>
 *     <Inject key={XMLNS} value={SVG}>
 *       {() => <svg>...</svg>}
 *     </Inject>
 *   </>
 * );
 * ```
 */
declare const XMLNS: ContextKey<"http://www.w3.org/1999/xhtml" | "http://www.w3.org/2000/svg" | "http://www.w3.org/1998/Math/MathML">;
/**
 * Append content to a node.
 *
 * @param node The node.
 * @param content The content to append.
 */
declare function appendContent(node: Node, content: unknown): void;
type ClassValue = Expression<undefined | null | false | string | Record<string, Expression<boolean | undefined>> | ClassValue[]>;
type HyphenCase<T> = T extends `${infer A}${infer B}` ? `${A extends Capitalize<A> ? "-" : ""}${Lowercase<A>}${HyphenCase<B>}` : T;
type StyleMap = {
	[K in keyof CSSStyleDeclaration as HyphenCase<K>]?: Expression<undefined | null | string>;
} & {
	[K in string]?: Expression<undefined | null | string>;
};
type StyleValue = Expression<undefined | StyleMap | StyleValue[]>;
/**
 * Represents an object with element attributes.
 */
type Attributes = {
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
/**
 * Set attributes on an element.
 *
 * @param elem The element.
 * @param attrs The attributes to set.
 */
declare function setAttributes(elem: Element, attrs: Attributes): void;
/**
 * Create an element.
 *
 * @param tagName The tag name.
 * @param attrs The attributes to set.
 * @param content The content to append.
 * @returns The element.
 */
declare function createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, attrs: Attributes, content: unknown): HTMLElementTagNameMap[K];
declare function createElement<K extends keyof SVGElementTagNameMap>(tagName: K, attrs: Attributes, content: unknown): SVGElementTagNameMap[K];
declare function createElement<K extends keyof MathMLElementTagNameMap>(tagName: K, attrs: Attributes, content: unknown): MathMLElementTagNameMap[K];
declare function createElement<E extends Element>(tagName: string, attrs: Attributes, content: unknown): E;
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
declare function e<K extends keyof HTMLElementTagNameMap>(tagName: K, content?: unknown[]): HTMLElementTagNameMap[K];
declare function e<K extends keyof HTMLElementTagNameMap>(tagName: K, attrs?: Attributes, content?: unknown[]): HTMLElementTagNameMap[K];
declare function e<K extends keyof SVGElementTagNameMap>(tagName: K, content?: unknown[]): SVGElementTagNameMap[K];
declare function e<K extends keyof SVGElementTagNameMap>(tagName: K, attrs?: Attributes, content?: unknown[]): SVGElementTagNameMap[K];
declare function e<K extends keyof MathMLElementTagNameMap>(tagName: K, content?: unknown[]): MathMLElementTagNameMap[K];
declare function e<K extends keyof MathMLElementTagNameMap>(tagName: K, attrs?: Attributes, content?: unknown[]): MathMLElementTagNameMap[K];
declare function e<E extends Element>(tagName: string, content?: unknown[]): E;
declare function e<E extends Element>(tagName: string, attrs?: Attributes, content?: unknown[]): E;

/**
 * Allocate an ID that is unique in the current thread.
 *
 * @returns The unique id.
 */
declare function uniqueId(): string;
/**
 * Run a function with an ID that is unique in the current thread.
 *
 * @param fn The function to run.
 * @returns The function's return value.
 */
declare function useUniqueId<T>(fn: (id: string) => T): T;

/**
 * A function that can be called to dispose something.
 */
type TeardownHook = () => void;
/**
 * Run a function while capturing teardown hooks.
 *
 * @param fn The function to run.
 * @returns A function to run all captured teardown hooks.
 */
declare function capture(fn: () => void): TeardownHook;
/**
 * Run a function while capturing teardown hooks that may dispose itself.
 *
 * @param fn The function to run.
 * @returns The function's return value.
 */
declare function captureSelf<T>(fn: (dispose: TeardownHook) => T): T;
/**
 * Run a function without capturing any teardown hooks.
 *
 * This is the opposite of {@link capture}.
 *
 * @param fn The function to run.
 * @returns The function's return value.
 */
declare function uncapture<T>(fn: () => T): T;
/**
 * Register a teardown hook.
 *
 * This has no effect if teardown hooks are not captured in the current context.
 */
declare function teardown(hook: TeardownHook): void;

type Falsy = null | undefined | false | 0 | 0n | "";

/**
 * A function that is called when the view boundary may have been changed.
 */
interface ViewBoundaryOwner {
	/**
	 * @param first The current first node.
	 * @param last The current last node.
	 */
	(first: Node, last: Node): void;
}
/**
 * A function that must be called after the view boundary has been changed.
 */
interface ViewSetBoundaryFn {
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
interface ViewInitFn {
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
declare class View {
	#private;
	/**
	 * Create a new view.
	 *
	 * View implementations need to guarantee that:
	 * + The view doesn't break if the parent is replaced from the outside.
	 * + The boundary is updated when the first or last node has been replaced.
	 * + If there are multiple nodes, all nodes remain in the current parent.
	 * + If there are multiple nodes, the initial nodes must have a parent.
	 */
	constructor(init: ViewInitFn);
	/**
	 * The current first node of this view.
	 */
	get first(): Node;
	/**
	 * The current last node of this view.
	 */
	get last(): Node;
	/**
	 * The current parent node or undefined if there is none.
	 */
	get parent(): Node | undefined;
	/**
	 * Set the boundary owner for this view until the current lifecycle is disposed.
	 *
	 * @throws An error if there currently is a boundary owner.
	 */
	setBoundaryOwner(owner: ViewBoundaryOwner): void;
	/**
	 * Get all nodes of this view as a single node for moving them into a new place.
	 *
	 * If there are multiple nodes, a document fragment containing all nodes of this view is returned.
	 */
	take(): Node | DocumentFragment;
	/**
	 * Detach all nodes of this view from the current parent if there is one.
	 *
	 * If there are multiple nodes, they are moved into a new document fragment to allow the view implementation to stay alive.
	 */
	detach(): void;
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
declare function viewNodes(view: View): IterableIterator<Node>;
/**
 * Create a view that renders content depending on an expression.
 *
 * @param expr An expression that returns a function to create content or null or undefined to render nothing.
 * @returns The view.
 */
declare function nest(expr: Expression<(() => unknown) | null | undefined>): View;
/**
 * Create a view that renders conditional content.
 *
 * @param value The expression to evaluate.
 * @param thenFn A function to create content if the value is truthy.
 * @param elseFn An optional function to create content if the value is falsy.
 * @returns The view.
 */
declare function when<T>(value: Expression<T | Falsy>, thenFn: (value: T) => unknown, elseFn?: () => unknown): View;
/**
 * A function to create content for a specific value.
 */
interface IterUniqueContentFn<T> {
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
 * @param content A function to create content for a specific value.
 * @returns The view.
 */
declare function iterUnique<T>(expr: Expression<Iterable<T>>, content: IterUniqueContentFn<T>): View;
/**
 * A function to create content for a specific index and value.
 */
interface IterContentFn<T> {
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
 * @param content A function to create content for a specific index and value.
 * @returns The view.
 */
declare function iter<T>(expr: Expression<Iterable<T>>, content: (value: T, index: number) => unknown): View;
/**
 * A wrapper that can be used for moving and reusing views.
 */
declare class MovableView {
	#private;
	constructor(view: View);
	/**
	 * Create a new view that contains the wrapped view until it is moved again or detached.
	 */
	move(): View;
	/**
	 * Detach the wrapped view if attached.
	 */
	detach(): void;
}
/**
 * Render and wrap arbitrary content so that it can be moved and reused.
 */
declare function movable(content: unknown): MovableView;
/**
 * Render content and attach it to the tree depending on an expression.
 */
declare function show(expr: Expression<boolean>, content: unknown): View;

/**
 * Create a text node that displays the result of an expression.
 *
 * Null and undefined are displayed as an empty string.
 */
declare function createText(expr: Expression<unknown>): Text;
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
declare function render(content: unknown): View;
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
declare function mount(parent: Node, content: unknown): View;

/**
 * Create a new abort controller that aborts when the current lifecycle is disposed.
 */
declare function useAbortController(reason?: unknown): AbortController;
/**
 * Get an abort signal that aborts when the current lifecycle is disposed.
 */
declare function useAbortSignal(reason?: unknown): AbortSignal;

interface AsyncOptions<T> {
	/**
	 * The async function or promise.
	 */
	source: (() => Promise<T>) | Promise<T>;
	/**
	 * A function render content while pending.
	 *
	 * By default, nothing is rendered.
	 */
	pending?: () => unknown;
	/**
	 * A function to render content when resolved.
	 *
	 * By default, nothing is rendered.
	 */
	resolved?: (value: T) => unknown;
	/**
	 * A function to render content when rejected.
	 *
	 * By default, nothing is rendered.
	 */
	rejected?: (value: unknown) => unknown;
}
/**
 * Create view that renders content depending on the state of an async function or promise.
 *
 * This task is tracked using the current {@link ASYNC async context} if any. It is guaranteed, that the view is updated before the tracked task completes.
 *
 * @param options An object with options.
 * @returns The view.
 */
declare function async<T>(options: AsyncOptions<T>): View;

/**
 * Represents pending operations in an asynchronously rendered tree.
 *
 * This can be used to wait until an entire async tree is rendered or to check if any errors occurred.
 */
declare class AsyncContext {
	#private;
	constructor(parent?: AsyncContext);
	/**
	 * Reactively check if there are any pending tasks in this context.
	 */
	get pending(): boolean;
	/**
	 * Track the specified task in this and all parent contexts.
	 */
	track(task: Promise<unknown>): void;
	/**
	 * Wait until all tracked tasks in this and all child contexts have completed.
	 *
	 * This also includes new tasks that are tracked while waiting.
	 *
	 * @throws Errors thrown by any tracked task or an {@link AsyncError} if multiple tasks failed.
	 */
	complete(): Promise<void>;
	/**
	 * Create a new async context using the {@link extract current} context as parent.
	 */
	static fork(): AsyncContext;
}
declare class AsyncError extends Error {
	errors: unknown[];
	constructor(errors: unknown[]);
}
/**
 * Context key for the current {@link AsyncContext}.
 */
declare const ASYNC: ContextKey<AsyncContext>;

/**
 * A queue for sequentially running async tasks that can be triggered by both the user and side effects.
 */
declare class TaskSlot {
	#private;
	/**
	 * Create a new task slot.
	 *
	 * When the current lifecycle is disposed, all side effects are aborted and removed from the queue.
	 */
	constructor();
	/**
	 * Queue a side effect to run if this slot isn't blocked.
	 *
	 * This will abort and remove all other side effects from the queue.
	 *
	 * @param task The side effect to queue.
	 */
	sideEffect(task: (signal: AbortSignal) => unknown | Promise<unknown>): void;
	/**
	 * Queue a task to run and block this slot until it completes.
	 *
	 * This will abort and remove all other side effects from the queue.
	 *
	 * @param task The blocking task to queue.
	 * @returns The result of the task.
	 */
	block<T>(task: () => T | Promise<T>): Promise<T>;
}

type TaskSource = (() => unknown) | Promise<unknown> | null | undefined;
interface TasksOptions {
	/**
	 * If true, focus is restored on the last active element when there are no more pending tasks in this instance.
	 *
	 * By default, this is inherited from the parent or true of there is none.
	 */
	restoreFocus?: boolean;
}
/**
 * Represents a set of pending tasks in a specific context.
 *
 * This is meant to be used for preventing concurrent user interaction in a specific context.
 */
declare class Tasks {
	#private;
	/**
	 * Create a new tasks instance with the specified parent.
	 *
	 * @param parent The parent to use. Default is no parent.
	 */
	constructor(parent?: Tasks, options?: TasksOptions);
	/**
	 * The parent instance or undefined if there is none.
	 */
	get parent(): Tasks | undefined;
	/**
	 * True if this instance has any pending tasks.
	 */
	get selfPending(): boolean;
	/**
	 * True if this instance or any of it's parents has any pending tasks.
	 */
	get pending(): boolean;
	/**
	 * Pretend, that there is a pending task until the current lifecycle is disposed.
	 */
	setPending(): void;
	/**
	 * Wait for an async function or a promise.
	 *
	 * @param source The async function or promise to wait for.
	 */
	waitFor(source: TaskSource): void;
	/**
	 * Create a new tasks instance using the {@link extract current} instance as parent.
	 */
	static fork(options?: TasksOptions): Tasks;
}
/**
 * Context key for the current {@link Tasks} instance.
 */
declare const TASKS: ContextKey<Tasks>;
/**
 * Check if there are any pending tasks in the current tasks instance.
 *
 * This can be used in conjuction with {@link waitFor} to indicate if there are any pending tasks.
 *
 * This is meant to be used for preventing concurrent user interaction in a specific context.
 */
declare function isSelfPending(): boolean;
/**
 * Check if there are any pending tasks in the current tasks instance or any of it's parents.
 *
 * This can be used in conjunction with {@link waitFor} to disable inputs and buttons while there are any pending tasks.
 *
 * This is meant to be used for preventing concurrent user interaction in a specific context.
 */
declare function isPending(): boolean;
/**
 * Pretend, that there is a pending task in the current tasks instance until the current lifecycle is disposed.
 *
 * This is meant to be used for preventing concurrent user interaction in a specific context.
 *
 * @example
 * ```tsx
 * import { inject, TASKS, Tasks, capture, setPending, isPending } from "@mxjp/gluon";
 *
 * inject(TASKS, new Tasks(), () => {
 *   isPending(); // => false
 *   const stop = capture(setPending);
 *   isPending(); // => true
 *   stop();
 *   isPending(); // => false
 * });
 * ```
 */
declare function setPending(): void;
/**
 * Use the current tasks instance to wait for an async function or promise.
 *
 * This is meant to be used for preventing concurrent user interaction in a specific context.
 *
 * @param source The async function or promise to wait for.
 */
declare function waitFor(source: TaskSource): void;

type WaitGuardCondition<T, R extends T> = (value: T) => value is R;
type WaitCondition<T> = (value: T) => boolean;
declare class WaitForTimeoutError extends Error {
}
/**
 * Utility to watch an expression until it's output satisfies a condition.
 *
 * @param expr The expression to watch.
 * @param condition The condition to test. By default, all truthy values are matched.
 * @param timeout An optional timeout. Default is no timeout.
 * @returns A promise that resolves with the first matched output or rejects with a {@link WaitForTimeoutError}.
 */
declare function watchFor<T>(expr: Expression<T | Falsy>, timeout?: number): Promise<T>;
declare function watchFor<T, R extends T>(expr: Expression<T>, condition?: WaitGuardCondition<T, R>, timeout?: number): Promise<R>;
declare function watchFor<T>(expr: Expression<T>, condition?: WaitCondition<T>, timeout?: number): Promise<T>;

interface Router {
	/**
	 * The root router.
	 */
	get root(): Router;
	/**
	 * The parent of this router if any.
	 */
	get parent(): Router | undefined;
	/**
	 * Get the remaining normalized path in this context.
	 */
	get path(): string;
	/**
	 * The search parameters in this context.
	 */
	get query(): URLSearchParams | undefined;
	/**
	 * Navigate to the specified path within the path this router is mounted in.
	 *
	 * @param path The path. This may not be normalized.
	 * @param query The query part.
	 */
	push(path: string, query?: QueryInit): void;
	/**
	 * Same as {@link push}, but replaces the URL in history if possible.
	 */
	replace(path: string, query?: QueryInit): void;
}
type QueryInit = ConstructorParameters<typeof URLSearchParams>[0];
/**
 * Context key for the current {@link Router} instance.
 */
declare const ROUTER: ContextKey<Router>;

declare class ChildRouter implements Router {
	#private;
	constructor(parent: Router, mountPath: string, path: Expression<string>);
	get root(): Router;
	get parent(): Router | undefined;
	get path(): string;
	get query(): URLSearchParams | undefined;
	push(path: string, query?: QueryInit): void;
	replace(path: string, query?: QueryInit): void;
}

interface HashRouterOptions {
	/**
	 * The current location is parsed when one of these events occur.
	 *
	 * @default ["hashchange"]
	 */
	parseEvents?: string[];
}
declare class HashRouter implements Router {
	#private;
	constructor(options?: HashRouterOptions);
	get root(): Router;
	get parent(): Router | undefined;
	get path(): string;
	get query(): URLSearchParams | undefined;
	push(path: string, query?: QueryInit): void;
	replace(path: string, query?: QueryInit): void;
}

interface HistoryRouterOptions {
	/**
	 * The current location is parsed when one of these events occur.
	 *
	 * @default ["popstate", "gluon:router:update"]
	 */
	parseEvents?: string[];
}
/**
 * A router that uses the history API.
 */
declare class HistoryRouter implements Router {
	#private;
	constructor(options?: HistoryRouterOptions);
	get root(): Router;
	get parent(): Router | undefined;
	get path(): string;
	get query(): URLSearchParams | undefined;
	push(path: string, query?: QueryInit): void;
	replace(path: string, query?: QueryInit): void;
}
declare function formatPath(path: string, query?: QueryInit): string;

/**
 * Normalize a path:
 * + Empty paths are represented as an empty string.
 * + Non-empty paths start with a slash.
 *
 * @param path The path to normalize.
 * @param preserveDir True to keep trailing slashes.
 * @returns The normalized path.
 */
declare function normalize(path: string, preserveDir?: boolean): string;
/**
 * Join two paths.
 *
 * @param parent The parent path.
 * @param child The child path.
 * @param preserveDir True to keep trailing slashes from the child path.
 * @returns A {@link normalize normalized} path.
 */
declare function join(parent: string, child: string, preserveDir?: boolean): string;

interface RouteMatchFn {
	(path: string): string | [string, unknown] | undefined;
}
interface Route {
	/**
	 * The paths this route matches.
	 */
	path?: string | RegExp | RouteMatchFn;
}
interface ParentRouteMatch<T extends Route> {
	route: T;
	path: string;
	params: unknown;
}
interface RouteMatch<T extends Route> extends ParentRouteMatch<T> {
	rest: string;
}
/**
 * Find the first matching route.
 *
 * @param path The {@link normalize normalized} path to match against. Non normalized paths result in undefined behavior.
 * @param routes The routes to test in order.
 * @returns A match or undefined if none of the routes matched.
 */
declare function matchRoute<T extends Route>(path: string, routes: T[]): RouteMatch<T> | undefined;
declare class WatchedRoutes<T extends Route> {
	#private;
	constructor(match: Signal<ParentRouteMatch<T> | undefined>, rest: Signal<string>);
	/**
	 * Access the route match.
	 */
	get match(): ParentRouteMatch<T> | undefined;
	/**
	 * Access the rest path.
	 *
	 * This is set to an empty string if no route matched.
	 */
	get rest(): string;
}
/**
 * Watch and match routes against an expression.
 *
 * @param path The normalized path.
 * @param routes The routes to watch.
 */
declare function watchRoutes<T extends Route>(path: Expression<string>, routes: T[]): WatchedRoutes<T>;
interface ContentRoute extends Route {
	content: (params: unknown) => unknown;
}
declare function routes(routes: ContentRoute[]): View;

export { ASYNC, AsyncContext, AsyncError, type AsyncOptions, type Attributes, ChildRouter, type ClassValue, type ContentRoute, type Context, type ContextKey, type ContextValue, type Expression, type ExpressionResult, HTML, HashRouter, type HashRouterOptions, HistoryRouter, type HistoryRouterOptions, type IterContentFn, type IterUniqueContentFn, MATHML, type MapFn, MovableView, type ParentRouteMatch, type QueryInit, ROUTER, type ReadonlyContext, type Route, type RouteMatch, type RouteMatchFn, type Router, SVG, Signal, type SignalEqualsFn, type StyleMap, type StyleValue, TASKS, TaskSlot, type TaskSource, Tasks, type TasksOptions, type TeardownHook, View, type ViewBoundaryOwner, type ViewInitFn, type ViewSetBoundaryFn, type WaitCondition, WaitForTimeoutError, type WaitGuardCondition, WatchedRoutes, XMLNS, appendContent, async, batch, capture, captureSelf, createElement, createText, deriveContext, e, extract, formatPath, get, getContext, inject, isPending, isSelfPending, iter, iterUnique, join, lazy, map, matchRoute, memo, mount, movable, nest, normalize, optionalString, render, routes, runInContext, setAttributes, setPending, show, sig, string, teardown, track, trigger, uncapture, uniqueId, untrack, useAbortController, useAbortSignal, useUniqueId, viewNodes, waitFor, watch, watchFor, watchRoutes, when, wrapContext };
