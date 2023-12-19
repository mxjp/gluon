import { View, nest } from "../core/view.js";
import { sig } from "../core/signals.js";
import { waitFor } from "./tasks.js";

export interface UnwrapOptions<T> {
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
	resolved?: (value: T) => unknown;

	/**
	 * A function to render content when rejected.
	 */
	rejected?: (value: unknown) => unknown;

	/**
	 * If false (default), the pending task is registered using {@link waitFor}.
	 */
	inert?: boolean;
}

/**
 * Create view that renders content depending on the state of an async function or promise.
 *
 * @param options An object with options.
 * @returns The view.
 */
export function unwrap<T>(options: UnwrapOptions<T>): View {
	const { source, pending, resolved, rejected, inert = false } = options;

	const state = sig<{
		type: "pending";
		value: undefined;
	} | {
		type: "resolved";
		value: T;
	} | {
		type: "rejected";
		value: unknown;
	}>({ type: "pending", value: undefined });

	let promise: Promise<T>;
	if (typeof source === "function") {
		promise = (async () => source())();
	} else {
		promise = source;
	}

	promise.then(value => {
		state.value = { type: "resolved", value };
	}, value => {
		state.value = { type: "rejected", value }
	});

	if (!inert) {
		waitFor(promise);
	}

	return nest(() => {
		switch (state.value.type) {
			case "pending": return pending;
			case "resolved": {
				const { value } = state.value;
				return resolved ? (() => resolved(value)) : undefined;
			}
			case "rejected": {
				const { value } = state.value;
				return rejected ? (() => rejected(value)) : undefined;
			}
		}
	});
}
