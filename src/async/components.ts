import { Tasks, useTasks } from "./tasks.js";
import { unwrap } from "./unwrap.js";

/**
 * Renders content with a specific tasks instance.
 *
 * By default, a new child instance is created.
 */
export function UseTasks(props: {
	/**
	 * A function to render content.
	 */
	children: () => unknown;

	/**
	 * The tasks instance.
	 */
	tasks?: Tasks;
}): unknown {
	return useTasks(props.children, props.tasks);
}

/**
 * Renders content depending on the state of an async function or promise.
 */
export function Unwrap<T>(props: {
	/**
	 * The async function or promise to unwrap.
	 */
	source: (() => Promise<T>) | Promise<T>;

	/**
	 * A function render content while pending.
	 */
	pending?: () => unknown;

	/**
	 * A function to render content when resolved.
	 */
	children?: (value: T) => unknown;

	/**
	 * A function to render content when rejected.
	 */
	rejected?: (value: unknown) => unknown;

	/**
	 * If false (default), the pending task is registered using {@link waitFor}.
	 */
	inert?: boolean;
}): unknown {
	return unwrap({
		source: props.source,
		pending: props.pending,
		resolved: props.children,
		rejected: props.rejected,
		inert: props.inert,
	});
}
