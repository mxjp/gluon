import "../env.js";

import { strictEqual } from "node:assert";
import test from "node:test";

import { uniqueId } from "@mxjp/gluon";

import { INTERNAL_GLOBALS } from "../../dist/es/core/internals.js";

const { NEXT_ID } = INTERNAL_GLOBALS;

await test("uniqueId", async ctx => {
	await ctx.test("initial usage", () => {
		const first = uniqueId();
		const match = /^gluon_(\d+)$/.exec(first);
		if (!match) {
			throw new Error("invalid id format");
		}
		let counter = Number(match[1]);
		strictEqual(uniqueId(), `gluon_${++counter}`);
		strictEqual(uniqueId(), `gluon_${++counter}`);
	});

	await ctx.test("max safe int overflow", () => {
		const original = NEXT_ID.value;
		try {
			NEXT_ID.value = Number.MAX_SAFE_INTEGER - 2;
			strictEqual(uniqueId(), `gluon_${Number.MAX_SAFE_INTEGER - 2}`);
			strictEqual(uniqueId(), `gluon_${Number.MAX_SAFE_INTEGER - 1}`);
			strictEqual(typeof NEXT_ID.value, "number");

			strictEqual(uniqueId(), `gluon_${BigInt(Number.MAX_SAFE_INTEGER)}`);
			strictEqual(typeof NEXT_ID.value, "bigint");

			strictEqual(uniqueId(), `gluon_${BigInt(Number.MAX_SAFE_INTEGER) + 1n}`);
			strictEqual(uniqueId(), `gluon_${BigInt(Number.MAX_SAFE_INTEGER) + 2n}`);
			strictEqual(uniqueId(), `gluon_${BigInt(Number.MAX_SAFE_INTEGER) + 3n}`);
		} finally {
			NEXT_ID.value = original;
		}
	});
});
