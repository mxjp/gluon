import { show, sig, teardown } from "@mxjp/gluon";

export function loadingMessage(content: unknown) {
	const visible = sig(false);
	const timeout = setTimeout(() => {
		visible.value = true;
	}, 300);
	teardown(() => clearTimeout(timeout));
	return show(visible, content);
}
