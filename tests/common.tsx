import "./env.js";

import { deepStrictEqual, strictEqual } from "node:assert";

import { shareInstancesOf, teardown, View, ViewBoundaryOwner } from "@mxjp/gluon";

export function assertEvents(events: unknown[], expected: unknown[]): void {
	deepStrictEqual(events, expected);
	events.length = 0;
}

export function text(node: Node): string {
	if (node instanceof Comment) {
		return "";
	}
	return (node.textContent ?? "").trim();
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function testView(prefix = "") {
	let nextFirst!: () => Node;
	let nextLast!: () => Node;

	let i = 0;
	const view = new View((setBoundary, self) => {
		const first = <div>{prefix}f</div> as HTMLElement;
		const last = <div>l</div> as HTMLElement;
		const frag = document.createDocumentFragment();
		frag.append(first, last);
		setBoundary(first, last);

		nextFirst = () => {
			const next = <div>{prefix}f{i++}</div> as HTMLElement;
			self.parent!.insertBefore(next, self.last);
			self.parent!.removeChild(self.first);
			setBoundary(next, undefined);
			return next;
		};

		nextLast = () => {
			const next = <div>l{i++}</div> as HTMLElement;
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

export type TestView = ReturnType<typeof testView>;

export function boundaryEvents(events: unknown[]): ViewBoundaryOwner {
	return (first, last) => {
		events.push(text(first) + text(last));
	};
}

export function lifecycleEvent(events: unknown[], key: string): void {
	events.push(`s:${key}`);
	teardown(() => {
		events.push(`e:${key}`);
	});
}

export type ResolveFn<T> = (value: T | PromiseLike<T>) => void;
export type RejectFn = (error: unknown | void | PromiseLike<unknown | void>) => void;

export function future<T = void>(): [Promise<T>, ResolveFn<T>, RejectFn] {
	let resolve!: ResolveFn<T>;
	let reject!: RejectFn;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return [promise, resolve, reject];
}

export function assertSharedInstance<T extends new(...args: any) => unknown>(targetClass: T, symbolKey: string, sampleInstance: InstanceType<T>): void {
	// eslint-disable-next-line @typescript-eslint/no-extraneous-class
	class Dummy {
		static {
			shareInstancesOf(this, symbolKey);
		}
	}

	strictEqual(sampleInstance instanceof targetClass, true);
	strictEqual({ [Symbol.for(symbolKey)]: true } instanceof targetClass, true);
	strictEqual(new Dummy() instanceof targetClass, true);
	strictEqual(sampleInstance instanceof Dummy, true);
}

export function withMsg(message: string): (error: unknown) => boolean {
	return error => {
		return (error instanceof Error) && error.message === message;
	};
}
