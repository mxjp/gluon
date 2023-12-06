import { uniqueId } from "./ids.js";

/**
 * Create a CSS module like stylesheet with unique prefixed class names.
 *
 * @param css The css code.
 * @param options Options for constructing the stylesheet.
 * @returns A tuple with a map from original class names to their prefixed versions and the stylesheet instance.
 *
 * @example
 * ```tsx
 * import { stylesheet, mount } from "@mxjp/gluon";
 *
 * const [classes, sheet] = stylesheet(`
 *   .example {
 *     color: red;
 *   }
 * `);
 *
 * mount(
 *   document.body,
 *   <h1 class={classes.example}>Hello World!</h1>
 * );
 * ```
 */
export function stylesheet(css: string, options?: CSSStyleSheetInit): [map: Record<string, string>, sheet: CSSStyleSheet] {
	const sheet = new CSSStyleSheet(options);
	sheet.replaceSync(css);
	const map: Record<string, string> = {};
	const prefix = `${uniqueId()}_`;
	for (const rule of sheet.cssRules) {
		if (rule instanceof CSSStyleRule) {
			rule.selectorText = rule.selectorText.replace(/\.([a-z_-]+)/gi, (_, name) => {
				const prefixed = prefix + name;
				map[name] = prefixed;
				return `.${prefixed}`;
			});
		}
	}
	document.adoptedStyleSheets.push(sheet);
	return [map, sheet];
}
