import { strictEqual } from "node:assert";
import test from "node:test";

import { capture } from "rvx";
import { useAbortSignal } from "rvx/async";

await test("async/abort", () => {
	let signal!: AbortSignal;
	const dispose = capture(() => {
		signal = useAbortSignal(42);
	});

	strictEqual(signal.aborted, false);
	dispose();
	strictEqual(signal.aborted, true);
});
