import { deepStrictEqual } from "node:assert";

import { View, ViewBoundaryOwner } from "@mxjp/gluon";

export function assertEvents(events: unknown[], expected: unknown[]) {
	deepStrictEqual(events, expected);
	events.length = 0;
}

export function text(node: Node) {
	return (node.textContent ?? "").trim();
}

export function testView() {
	let nextFirst!: () => Node;
	let nextLast!: () => Node;

	let i = 0;
	const view = new View((setBoundary, self) => {
		const first = <div>f</div>;
		const last = <div>l</div>;
		const frag = document.createDocumentFragment();
		frag.append(first, last);
		setBoundary(first, last);

		nextFirst = () => {
			const next = <div>f{i++}</div>;
			self.parent!.insertBefore(next, self.last);
			self.parent!.removeChild(self.first);
			setBoundary(next, undefined);
			return next;
		};

		nextLast = () => {
			const next = <div>l{i++}</div>;
			self.parent!.insertBefore(next, self.last);
			self.parent!.removeChild(self.last);
			setBoundary(undefined, next);
			return next;
		};
	});

	return {
		view,
		nextFirst,
		nextLast,
	};
}

export function boundaryEvents(events: unknown[]): ViewBoundaryOwner {
	return (first, last) => {
		events.push(text(first) + text(last));
	};
}
