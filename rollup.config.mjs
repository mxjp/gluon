import { defineConfig } from "rollup";
import terser from "@rollup/plugin-terser";
import prettier from "rollup-plugin-prettier";
import { gzipSync } from "node:zlib";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const license = await readFile(join(fileURLToPath(import.meta.url), "../LICENSE"), "utf-8");

export default defineConfig({
	input: "./dist/es/index.js",
	output: [
		{
			file: "./dist/gluon.js",
			format: "es",
			plugins: [
				prettier({
					parser: "acorn",
					useTabs: true,
					printWidth: 120,
					singleQuote: false,
					semi: true,
					arrowParens: "avoid",
					bracketSameLine: true,
					bracketSpacing: true,
				}),
			],
		},
		{
			file: "./dist/gluon.min.js",
			format: "es",
			sourcemap: true,
			plugins: [
				terser({
				}),
				{
					writeBundle(_options, bundle) {
						const compressed = gzipSync(bundle["gluon.min.js"].code);
						console.log("Gzipped + minified:", compressed.byteLength);
					},
				},
			],
		},
	],
	plugins: [
		{
			banner: `/*!\n${license}*/`,
		},
	],
});
