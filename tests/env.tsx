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
	"Comment",
	"DocumentFragment",
	"HTMLDivElement",
	"CustomEvent",
	"MouseEvent",
]) {
	(globalThis as any)[key] = dom.window[key];
}
