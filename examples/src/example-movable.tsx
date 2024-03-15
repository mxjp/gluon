import { For, Show, movable, sig } from "@mxjp/gluon";

import { Row } from "./components/row";
import { Button } from "./components/button";

export function example() {
	const content = movable(<input type="text" value="Type here..." />);
	const place = sig(0);

	return <>
		<div>This demonstrates how content can be safely kept alive and passed around to new places.</div>
		<div>Using the devtools, you can verify that the input element below is only created once and then moved into new places.</div>

		<For each={[0, 1, 2]}>
			{i =>
				<Row>
					<Button action={() => { place.value = i; }}>Move here</Button>
					<Show when={() => place.value === i}>
						{() => content.move()}
					</Show>
				</Row>
			}
		</For>
	</>;
}
