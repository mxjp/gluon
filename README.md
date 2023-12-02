![gluon banner](./assets/banner.svg)

# gluon!
This is a tiny signal based rendering library that aims to be usable with widely adopted or even without any build systems to avoid maintenance overhead for long living projects.

## Documentation
+ [Installation](#installation)
  + [JSX Setup](#jsx-setup)
  + [Basic Usage](#basic-usage)

<br>



# Installation
Gluon is available as an [npm package](https://www.npmjs.com/package/@mxjp/gluon).
```bash
npm i @mxjp/gluon
```
Alternatively, you can copy the [human readable](https://www.unpkg.com/@mxjp/gluon/dist/gluon.js) or the [minified](https://www.unpkg.com/@mxjp/gluon/dist/gluon.min.js) bundle directly into your project.

## JSX Setup
Gluon's npm package supports jsx without any special transform and can be used in typescript by adding the two options below:
```js
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@mxjp/gluon"
  }
}
```

## Basic Usage
The **mount** function renders any supported content and appends it to an element.
```tsx
import { mount, e } from "@mxjp/gluon";

// Using jsx:
mount(document.body, <h1>Hello World!</h1>);

// Or without jsx:
mount(document.body, e("h1", ["Hello World!"]));
```
