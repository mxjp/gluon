# Installation
Gluon is available as an [npm package](https://www.npmjs.com/package/@mxjp/gluon).
```bash
npm i @mxjp/gluon
```

## JSX
Gluon provides a react 17 JSX runtime and a legacy runtime in case your build tool dosn't support the new runtime.

### TypeScript
To use JSX with typescript, add the following options to your tsconfig:
```js
{
	"compilerOptions": {
		"jsx": "react-jsx",
		"jsxImportSource": "@mxjp/gluon"
	}
}
```

### Babel
When using TypeScript, it is recommended to use the [compiler options](#typescript) specified abvove instead.

If you are using Babel with plain JavaScript, you can use the `@babel/plugin-transform-react-jsx` plugin with the following babel options:
```js
{
	"plugins": [
		[
			"@babel/plugin-transform-react-jsx",
			{
				"runtime": "automatic",
				"importSource": "@mxjp/gluon"
			}
		]
	]
}
```

### esbuild & Vite
When using TypeScript, it is recommended to use the [compiler options](#typescript) specified abvove instead.

If you are using esbuild or vite with plain JavaScript, you can add the options below:
```js
// esbuild.config.mjs
import * as esbuild from "esbuild";

await esbuild.build({
	jsx: "automatic",
	jsxImportSource: "@mxjp/gluon",
});
```
```js
// vite.config.mjs
import { defineConfig } from "vite";

export default defineConfig({
	esbuild: {
		jsx: "automatic",
		jsxImportSource: "@mxjp/gluon",
	},
});
```

### Other Build Systems
Although not documented here, you can also use any other build system that supports JSX.

To use the react 17 runtime (also called "automatic runtime"), use `@mxjp/gluon` as the import source.

To use the legacy runtime, you can manually import the `jsx` factory and the `Fragment` factory or automatically inject it using your build tool:
```js
import { jsx, Fragment } from "@mxjp/gluon/jsx";
```

## Buildless Options
You can also use gluon without any build system by directly using one of the es module bundles listed below. Note, that these bundles don't include any JSX related code and components.

| Modules | Human Readable | Minified | Types |
|-|-|-|-|
| Core | [gluon.js](https://unpkg.com/@mxjp/gluon/dist/gluon.js) | [gluon.min.js](https://unpkg.com/@mxjp/gluon/dist/gluon.min.js) | [gluon.d.ts](https://unpkg.com/@mxjp/gluon/dist/gluon.d.ts) |
| Core, Async, Router | [gluon.all.js](https://unpkg.com/@mxjp/gluon/dist/gluon.all.js) | [gluon.all.min.js](https://unpkg.com/@mxjp/gluon/dist/gluon.all.min.js) | [gluon.all.d.ts](https://unpkg.com/@mxjp/gluon/dist/gluon.all.d.ts) |

### Custom Bundles
If the bundles above don't fit your needs, you can build a custom bundle that only includes the modules you need:
```bash
git clone https://github.com/mxjp/gluon
cd gluon

npm ci
node scripts/bundle.js [...args]

# Bundle "core" and "async" into "./custom.js", "./custom.min.js" and "./custom.d.ts":
node scripts/bundle.js -m core async -o ./custom
```

+ `--modules | -m <...modules>`
	+ Specify what modules to include.
	+ This can be any directory or filename that exists in the [src](https://github.com/mxjp/gluon/tree/main/src) directory without file extension.
	+ Default is `core`
+ `--output | -o <path>`
	+ Specify the output path of the bundle without extension.
	+ Default is `./dist/gluon.custom`
