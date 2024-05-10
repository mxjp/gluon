import { doc } from "@mxjp/doc";
import { copyFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	root: "./src",
	base: "/gluon",
	build: {
		outDir: "../dist",
		target: "esnext",
	},
	optimizeDeps: {
		exclude: [
			"@mxjp/doc"
		],
	},
	server: {
		port: 8080,
	},
	plugins: [
		historyFallback(),
		doc({
			highlightLanguages: ["tsx", "bash", "html"],
		}),
	],
});

/** @returns {import("vite").Plugin} */
function historyFallback() {
	let dist;
	return {
		name: "github pages history fallback",
		apply: "build",
		configResolved(config) {
			dist = resolve(config.root, config.build.outDir);
		},
		async buildEnd() {
			await copyFile(join(dist, "index.html"), join(dist, "404.html"));
		},
	};
}
