import { Signal, View, render, sig, watch } from "@mxjp/gluon";
import { Row } from "./components/row";
import { Button } from "./components/button";
import { Box } from "./components/box";
import { TextInput } from "./components/text-input";

export function example() {
	const rotate = sig();
	return <>
		<div>This example shows a custom view that rotates the order of it's children when a signal is updated.</div>
		<Row>
			<Button action={() => rotate.notify()}>Rotate</Button>
		</Row>
		<Box>
			<Row>
				<RotateOrder on={rotate}>
					<TextInput style={{ width: "5rem" }} value={sig("A")} />
					<TextInput style={{ width: "5rem" }} value={sig("B")} />
					<TextInput style={{ width: "5rem" }} value={sig("C")} />
				</RotateOrder>
			</Row>
		</Box>
	</>;
}

function RotateOrder(props: {
	children?: unknown;
	on: Signal<void>;
}) {
	const children = [props.children].flat(Infinity);
	if (children.length < 2) {
		return children[0];
	}

	return new View((setBoundary, self) => {
		const views = children.map(render);

		for (const view of views) {
			view.setBoundaryOwner((first, last) => {
				if (view === views[0]) {
					setBoundary(first, undefined);
				}
				if (view === views[views.length - 1]) {
					setBoundary(undefined, last);
				}
			});
		}

		watch(props.on, () => {
			const parent = self.parent;
			if (parent) {
				const view = views.pop()!;
				parent.insertBefore(view.take(), views[0].first);
				views.unshift(view);
				setBoundary(views[0].first, views[views.length - 1].last);
			} else {
				const parent = document.createDocumentFragment();
				for (const view of views) {
					parent.appendChild(view.take());
				}
				setBoundary(parent.firstChild!, parent.lastChild!);
			}
		});
	});
}
