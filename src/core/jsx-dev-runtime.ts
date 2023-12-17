import { Attributes } from "./element.js";
import { Fragment, jsx } from "./jsx-runtime.js";

export * from "./jsx-runtime.js";

export function jsxDEV(tagName: string | typeof Fragment, props: Attributes & { children?: unknown }): unknown {
	return jsx(tagName, props);
}
