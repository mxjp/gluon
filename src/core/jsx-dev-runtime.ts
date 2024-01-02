import { jsx } from "./jsx-runtime.js";

export * from "./jsx-runtime.js";

export function jsxDEV(tagName: any, props: any, key: any): unknown {
	return jsx(tagName, props, key);
}
