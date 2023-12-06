import { Attributes } from "../core/index.js";
import { Fragment, jsx } from "./runtime.js";

export * from "./runtime.js";

export function jsxDEV(tagName: string | typeof Fragment, props: Attributes & { children?: unknown }): unknown {
	return jsx(tagName, props);
}
