import test from "node:test";

import { capture, Emitter } from "@mxjp/gluon";

import { assertEvents } from "./common.js";

await test("events", () => {
	const events: unknown[] = [];
	const emitter = new Emitter<[foo: string, bar: number]>();

	events.push(0);
	const removeA = capture(() => {
		emitter.event((foo, _bar) => {
			events.push(["a", foo]);
		});
	});
	events.push(1);
	emitter.emit("a", 1);
	assertEvents(events, [0, 1, ["a", "a"]]);

	const removeB = capture(() => {
		emitter.event((_foo, bar) => {
			events.push(["b", bar]);
		});
	});
	events.push(2);
	emitter.emit("b", 2);
	assertEvents(events, [2, ["a", "b"], ["b", 2]]);

	removeA();
	emitter.emit("c", 3);
	assertEvents(events, [["b", 3]]);

	removeB();
	emitter.emit("d", 4);
	assertEvents(events, []);
});
