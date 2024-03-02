import { strictEqual } from "node:assert";
import test from "node:test";

import { uniqueId } from "@mxjp/gluon";

await test("ids", async () => {
	const first = uniqueId();
	const match = /^gluon_(\d+)$/.exec(first);
	if (!match) {
		throw new Error("invalid id format");
	}

	let counter = Number(match[1]);
	strictEqual(uniqueId(), `gluon_${++counter}`);
	strictEqual(uniqueId(), `gluon_${++counter}`);
});
