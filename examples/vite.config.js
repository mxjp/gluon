import { defineConfig } from "vite";

export default defineConfig({
	root: "./src",
	base: "/gluon",
	build: {
		outDir: "../dist",
		target: "esnext",
	},
	server: {
		port: 8080,
	},
});
