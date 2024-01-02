import { sig } from "@mxjp/gluon";

import { Button } from "./components/button";
import { Row } from "./components/row";

export function example() {
	const count = sig(0);
	return <>
		<div>A simple counter to demonstrate basic signals.</div>
		<Row>
			<Button action={() => { count.value++; }}>
				Clicked {count} {() => count.value === 1 ? "time" : "times"}!
			</Button>
		</Row>
	</>;
}
