import { async } from "./async.js";

/**
 * Renders content depending on the state of an async function or promise.
 *
 * This task is tracked using the current {@link ASYNC async context} if any. It is guaranteed, that the view is updated before the tracked task completes.
 */
export function Async<T>(props: {
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
	children?: (value: T) => unknown;

	/**
	 * A function to render content when rejected.
	 *
	 * By default, nothing is rendered.
	 */
	rejected?: (value: unknown) => unknown;
}): unknown {
	return async({
		source: props.source,
		pending: props.pending,
		resolved: props.children,
		rejected: props.rejected,
	});
}
