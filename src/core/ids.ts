import { INTERNAL_GLOBALS } from "./internals.js";

const { NEXT_ID } = INTERNAL_GLOBALS;

/**
 * Allocate an ID that is unique in the current thread.
 *
 * @returns The unique id.
 */
export function uniqueId(): string {
	return "gluon_" + String(NEXT_ID.value++);
}

/**
 * A component that provides a unique id to it's children.
 *
 * @example
 * ```tsx
 * import { mount, UseUniqueId } from "@mxjp/gluon";
 *
 * mount(
 *   document.body,
 *   <UseUniqueId>
 *     {id => <>
 *       <label for={id}>Text</label>
 *       <input type="text" id={id} />
 *     </>}
 *   </UseUniqueId>
 * );
 * ```
 */
export function UseUniqueId(props: {
	children: (id: string) => unknown;
}): unknown {
	return props.children(uniqueId());
}
