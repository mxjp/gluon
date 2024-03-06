import { TaskSlot } from "../async/task-slot.js";

const KEY = Symbol.for("gluon:test:task-slots");

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const SLOTS: Map<unknown, TaskSlot> = (globalThis as any)[KEY] ?? ((globalThis as any)[KEY] = new Map());

/**
 * Run an exclusive action for a specific purpose.
 *
 * @param key The key to identify the purpose.
 * @param action The action to run.
 */
export function exclusive<T>(key: unknown, action: () => T | Promise<T>): Promise<T> {
	let slot = SLOTS.get(key);
	if (slot === undefined) {
		slot = new TaskSlot();
		SLOTS.set(key, slot);
	}
	return slot.block(action);
}
