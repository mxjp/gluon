import "../env.js";

import { strictEqual } from "node:assert";
import test from "node:test";

import { uncapture, watch } from "@mxjp/gluon";
import { HistoryRouter } from "@mxjp/gluon/router";

import { assertEvents } from "../common.js";

let locationPath = "/";
let locationSearch = "";

function setUrl(data: unknown, unused: unknown, url: unknown) {
	strictEqual(data, null);
	strictEqual(unused, "");
	strictEqual(typeof url, "string");
	const queryStart = (url as string).indexOf("?");
	if (queryStart < 0) {
		locationPath = url as string;
		locationSearch = "";
	} else {
		locationPath = (url as string).slice(0, queryStart);
		locationSearch = (url as string).slice(queryStart);
	}
}

globalThis.history = {
	pushState: setUrl,
	replaceState: setUrl,
} as typeof globalThis.history;

globalThis.location = {
	get pathname() {
		return locationPath;
	},
	get search() {
		return locationSearch;
	},
} as typeof globalThis.location;

await test("router/history router", () => {
	locationPath = "/";
	locationSearch = "";

	const events: unknown[] = [];
	const router = uncapture(() => new HistoryRouter());
	strictEqual(router.root, router);
	strictEqual(router.parent, undefined);

	uncapture(() => {
		watch(() => [router.path, router.query] as const, ([path, query]) => {
			events.push([path, query?.toString()]);
		});
	});

	assertEvents(events, [["", undefined]]);

	router.push("/a", undefined);
	assertEvents(events, [["/a", undefined]]);

	router.push("/b", "test=1");
	assertEvents(events, [["/b", "test=1"]]);

	router.replace("/c", undefined);
	assertEvents(events, [["/c", undefined]]);

	router.push("/d", "test=2");
	assertEvents(events, [["/d", "test=2"]]);

	locationPath = "/e";
	locationSearch = "?test=3";
	window.dispatchEvent(new CustomEvent("popstate"));
	assertEvents(events, [["/e", "test=3"]]);

	locationPath = "/f";
	locationSearch = "?test=4";
	window.dispatchEvent(new CustomEvent("gluon:router:update"));
	assertEvents(events, [["/f", "test=4"]]);
});
