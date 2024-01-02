import { isWritable } from "@mxjp/gluon";
import { Bench, Group, offscreenSync } from "./common";

export const renderingBenches = new Group("Rendering", [
	new Bench("Attribute Prop Test", () => {
		const elem: HTMLElement = <div />;
		return offscreenSync({
			cycle() {
				isWritable(elem, "style");
			},
		});
	}),

	new Bench("Attribute Non-Prop Test", () => {
		const elem: HTMLElement = <div />;
		return offscreenSync({
			cycle() {
				isWritable(elem, "foo-bar");
			},
		});
	}),
]);
