import { isWritable } from "@mxjp/gluon";
import { BenchResult, offscreenSync } from "../common";

export function run(): BenchResult {
	const elem: HTMLElement = <div />;
	return offscreenSync({
		cycle() {
			isWritable(elem, "foo-bar");
		},
	});
}
