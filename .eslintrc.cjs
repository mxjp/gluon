const { resolve } = require("path");

module.exports = {
	root: true,
	extends: require.resolve("@mpt/eslint-rules/typescript.json"),
	parserOptions: {
		project: resolve(__dirname, "tsconfig.json"),
	},
	rules: {
	},
};
