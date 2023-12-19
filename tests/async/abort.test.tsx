import test from "node:test";
import { strictEqual } from "node:assert";

import { capture, useAbortSignal } from "@mxjp/gluon";

await test("async/abort", () => {

	let signal!: AbortSignal;
	const dispose = capture(() => {
		signal = useAbortSignal(42);
	});

	strictEqual(signal.aborted, false);
	dispose();
	strictEqual(signal.aborted, true);

});
