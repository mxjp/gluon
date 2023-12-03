import { mount } from "@mxjp/gluon";

if (document.readyState === "loading") {
	await new Promise(resolve => {
		window.addEventListener("DOMContentLoaded", resolve);
	});
}

mount(
	document.body,
	<>
		<h1>Hello World!</h1>
	</>
);
