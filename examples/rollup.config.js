import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "rollup";

const context = join(fileURLToPath(import.meta.url), "..");
const root = join(context, "..");
const src = join(context, "src");
const outDir = join(root, "docs/examples");

await mkdir(outDir, { recursive: true });

export default defineConfig({
	context,
	input: "virtual:main",
	output: {
		format: "es",
		file: join(outDir, "bundle.js"),
	},
	external: [],
	plugins: [
		{
			name: "gluon-examples",
			resolveId(id) {
				if (id === "virtual:main") {
					return id;
				}
			},
			async load(id) {
				if (id === "virtual:main") {
					const files = await readdir(src);
					const imports = [];
					const examples = [];
					for (let i = 0; i < files.length; i++) {
						const file = files[i];
						if (file.endsWith(".tsx")) {
							const name = file.slice(0, -4);
							imports.push(`import { Example as example_${i} } from ${JSON.stringify(join(src, file))};`);
							examples.push(`${JSON.stringify(name)}: example_${i},`);
						}
					}

					return `
						import { teardown } from "@mxjp/gluon";
						import { e } from "@mxjp/gluon/builder";
						import { GluonElement } from "@mxjp/gluon/element";

						${imports.join("\n")}

						const examples = {
							${examples.join("\n")}
						};

						class ExampleElement extends GluonElement {
							connectedCallback() {
								super.connectedCallback();
							}

							render() {
								return [
									e("link").set("rel", "stylesheet").set("href", "/gluon/stylesheets/examples.css"),
									examples[this.getAttribute("name")](),
								];
							}
						}

						customElements.define("gluon-example", ExampleElement);
					`;
				}
			},
			async transform(_code, id) {
				if (id.startsWith(src)) {
					const file = relative(src, id);
					if (file.endsWith(".tsx")) {
						let code = await readFile(id, "utf-8");
						const name = file.slice(0, -4);
						let md = "";

						const mdComment = /^\s*?\/\*([^]*?)\*\/\s*?/.exec(code);
						if (mdComment) {
							md += mdComment[1].trim() + "\n\n";
							code = code.slice(mdComment.index + mdComment[0].length).trim();
						}

						md += `<script type="module" src="/gluon/examples/bundle.js"></script>\n`;
						md += `<gluon-example name="${name}"></gluon-example>\n`;
						md += `\`\`\`jsx\n${code}\n\`\`\`\n\n`;

						await writeFile(join(outDir, `${name}.md`), md);
					}
				}
			},
		},
		nodeResolve(),
		typescript(),
		terser(),
	],
});
