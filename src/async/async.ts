import { extract } from "../core/context.js";
import { sig } from "../core/signals.js";
import { nest, View } from "../core/view.js";
import { ASYNC } from "./async-context.js";

export interface AsyncOptions<T> {
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
export function async<T>(options: AsyncOptions<T>): View {
	const { source, pending, resolved, rejected } = options;

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
	}, (value: unknown) => {
		state.value = { type: "rejected", value };
	});

	extract(ASYNC)?.track(promise);

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
