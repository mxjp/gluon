import { defineConfig } from "vite";
import { doc } from "@mxjp/doc";

export default defineConfig({
	root: "./src",
	base: "/gluon",
	build: {
		outDir: "../dist",
		target: "esnext",
		emptyOutDir: true,
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
		doc({
			highlightLanguages: ["tsx", "bash", "html"],
		}),
	],
});
