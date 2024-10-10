import { JSDOM } from "jsdom";

const dom = new JSDOM(`
	<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="UTF-8">
			<title>gluon!</title>
		</head>
		<body></body>
	</html>
`);

for (const key of [
	"window",
	"document",
	"Range",
	"Node",
	"Text",
	"Comment",
	"customElements",
	"DocumentFragment",
	"HTMLElement",
	"HTMLDivElement",
	"CustomEvent",
	"MouseEvent",
]) {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	(globalThis as any)[key] = dom.window[key];
}

const { onTeardownLeak } = await import("@mxjp/gluon/test");

onTeardownLeak(() => {
	throw new Error("teardown leak");
});
