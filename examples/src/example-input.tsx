import { sig } from "@mxjp/gluon";
import { TextInput } from "./components/text-input";
import { Row } from "./components/row";
import { Button } from "./components/button";

export function example() {
	const text = sig("Hello World!");
	return <>
		<div>A simple text input that uses a signal for two-way data binding.</div>
		<Row>
			<TextInput value={text} />
			<Button action={() => { text.value = ""; }}>Clear</Button>
		</Row>
		<div>
			You typed: <b>{text}</b>
		</div>
	</>;
}
