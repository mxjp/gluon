import { defineConfig } from "rollup";
import terser from "@rollup/plugin-terser";
import prettier from "rollup-plugin-prettier";
import { gzipSync } from "node:zlib";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const license = await readFile(join(fileURLToPath(import.meta.url), "../LICENSE"), "utf-8");

const corePath = fileURLToPath(new URL('dist/es/core/index.js', import.meta.url));

export function createConfig(input, name) {
	return defineConfig({
		input: `./dist/es/${input}.js`,
		external: [
			corePath,
		],
		output: [
			{
				file: `./dist/${name}.js`,
				format: "es",
				paths: {
					[corePath]: "./gluon.js",
				},
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
				file: `./dist/${name}.min.js`,
				format: "es",
				sourcemap: true,
				paths: {
					[corePath]: "./gluon.min.js",
				},
				plugins: [
					terser(),
					{
						writeBundle(_options, bundle) {
							const compressed = gzipSync(bundle[`${name}.min.js`].code);
							console.log(`minified + gzip: ${compressed.byteLength}`);
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
}
