import { Signal, sig, watch } from "@mxjp/gluon";
import { TextInput } from "./components/text-input";
import { Row } from "./components/row";
import { Button } from "./components/button";

export function example() {
	const direct = sig("Hello World!");
	const trimmed = sig("Hello World!");
	const number = sig(42);
	const email = sig("testify@example.com");

	return <>
		<div>This demonstrates the use of signals as composable two way data bindings.</div>
		<div>All the examples below use the same underlying input component and only pass in different signals.</div>

		<h2>Direct</h2>
		<div>This example uses the source signal directly for reference.</div>
		<Row>
			<TextInput value={direct} />
			<Button action={() => { direct.value = "Hello World!"; }}>Reset</Button>
		</Row>
		<div>
			Source: <b class="pre">{() => JSON.stringify(direct.value)}</b>
		</div>

		<h2>Trim</h2>
		<div>The source signal will contain the trimmed version of the input value.</div>
		<Row>
			<TextInput value={trimmed.pipe(trim)} />
			<Button action={() => { trimmed.value = "Hello World!"; }}>Reset</Button>
		</Row>
		<div>
			Source: <b class="pre">{() => JSON.stringify(trimmed.value)}</b>
		</div>

		<h2>Parse</h2>
		<div>The source signal will contain the input value parsed as an integer. Note, that changes are not passed to the source signal if the input is not an integer.</div>
		<Row>
			<TextInput value={number.pipe(parseInt)} />
			<Button action={() => { number.value = 42; }}>Reset</Button>
		</Row>
		<div>
			Source: <b class="pre">{() => JSON.stringify(number.value)}</b>
		</div>

		<h2>Composition & Shared Sources</h2>
		<div>This example shows an email address input with a single signal as backing storage. It also reuses the trim behavior from the example above for local part and domain.</div>
		<Row>
			<TextInput value={email.pipe(emailPart, true).pipe(trim)} />
			@
			<TextInput value={email.pipe(emailPart, false).pipe(trim)} />
			<Button action={() => { email.value = "testify@example.com"; }}>Reset</Button>
		</Row>
		<div>
			Source: <b class="pre">{() => JSON.stringify(email.value)}</b>
		</div>
	</>;
}

function trim(source: Signal<string>) {
	const input = sig(source.value);
	watch(input, value => {
		source.value = value.trim();
	}, true);
	watch(source, value => {
		if (input.value.trim() !== value) {
			input.value = value;
		}
	});
	return input;
}

function parseInt(source: Signal<number>) {
	const input = sig(String(source.value));
	watch(input, value => {
		if (/^\d+$/.test(value)) {
			source.value = Number(value);
		}
	}, true);
	watch(source, value => {
		if (!/^\d+$/.test(input.value) || Number(input.value) !== value) {
			input.value = String(value);
		}
	}, true);
	return input;
}

function emailPart(source: Signal<string>, localPart: boolean) {
	function parseEmail(email: string) {
		const sep = email.indexOf("@");
		return sep < 0
			? ["", ""]
			: [email.slice(0, sep), email.slice(sep + 1)];
	}

	const input = sig(parseEmail(source.value)[localPart ? 0 : 1]);
	watch(input, value => {
		if (!value.includes("@")) {
			if (localPart) {
				source.value = value + "@" + parseEmail(source.value)[1];
			} else {
				source.value = parseEmail(source.value)[0] + "@" + value;
			}
		}
	}, true);
	watch(source, value => {
		input.value = parseEmail(value)[localPart ? 0 : 1];
	}, true);
	return input;
}
