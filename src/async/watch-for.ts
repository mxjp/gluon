import { captureSelf, teardown } from "../core/lifecycle.js";
import { Expression, watch } from "../core/signals.js";
import { Falsy } from "../core/types.js";

export type WaitGuardCondition<T, R extends T> = (value: T) => value is R;
export type WaitCondition<T> = (value: T) => boolean;

export class WaitForTimeoutError extends Error {}

/**
 * Utility to watch an expression until it's output satisfies a condition.
 *
 * @param expr The expression to watch.
 * @param condition The condition to test. By default, all truthy values are matched.
 * @param timeout An optional timeout. Default is no timeout.
 * @returns A promise that resolves with the first matched output or rejects with a {@link WaitForTimeoutError}.
 */
export function watchFor<T>(expr: Expression<T | Falsy>, timeout?: number): Promise<T>;
export function watchFor<T, R extends T>(expr: Expression<T>, condition?: WaitGuardCondition<T, R>, timeout?: number): Promise<R>;
export function watchFor<T>(expr: Expression<T>, condition?: WaitCondition<T>, timeout?: number): Promise<T>;
export function watchFor<T>(expr: Expression<T>, condition?: WaitCondition<T> | number, timeout?: number): Promise<T> {
	if (typeof condition === "number") {
		timeout = condition;
		condition = Boolean as unknown as WaitCondition<T>;
	} else if (condition === undefined) {
		condition = Boolean as unknown as WaitCondition<T>;
	}
	return new Promise<T>((resolve, reject) => {
		captureSelf(dispose => {
			watch(expr, value => {
				if ((condition as WaitCondition<T>)(value)) {
					dispose();
					resolve(value);
				}
			});
			if (timeout !== undefined) {
				const handle = setTimeout(() => {
					dispose();
					reject(new WaitForTimeoutError());
				}, timeout);
				teardown(() => clearTimeout(handle));
			}
		});
	});
}
