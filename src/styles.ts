import { uniqueId } from "./ids.js";

/**
 * Create a CSS module like stylesheet with unique prefixed class names.
 *
 * @param css The css code.
 * @param options Options for constructing the stylesheet.
 * @returns A tuple with a map from original class names to their prefixed versions and the stylesheet instance.
 */
export function stylesheet(css: string, options?: CSSStyleSheetInit): [map: Record<string, string>, sheet: CSSStyleSheet] {
	const sheet = new CSSStyleSheet(options);
	sheet.replaceSync(css);
	const map: Record<string, string> = {};
	const prefix = `gluon_${uniqueId()}_`;
	for (const rule of sheet.cssRules) {
		if (rule instanceof CSSStyleRule) {
			rule.selectorText = rule.selectorText.replace(/ /gi, (_, name) => {
				const prefixed = prefix + name;
				map[name] = prefixed;
				return `.${prefixed}`;
			});
		}
	}
	document.adoptedStyleSheets.push(sheet);
	return [map, sheet];
}
