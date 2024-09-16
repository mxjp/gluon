/*

# Signal Conversion
When building user inputs, signals are the best way to pass data in and out of your components.

This example shows a "trim" function that derives a signal to automatically trim user input.

*/

import { Signal, sig, watchUpdates } from "@mxjp/gluon";

function trim(source: Signal<string>) {
	const input = sig(source.value);

	// Trim and write into the source signal:
	watchUpdates(input, value => {
		source.value = value.trim();
	});

	// Write into the input when the trimmed version is different:
	watchUpdates(source, value => {
		if (input.value.trim() !== value) {
			input.value = value;
		}
	});

	return input;
}

export function Example() {
	const text = sig("Hello World!");
	return <div class="column">
		<div class="row">
			<TextInput value={text.pipe(trim)} />
			<button on:click={() => { text.value = "Hello World!" }}>Reset</button>
		</div>
		<div>
			You typed: <b>{() => JSON.stringify(text.value)}</b>
		</div>
	</div>;
}

function TextInput(props: {
	value: Signal<string>;
}) {
	return <input
		type="text"
		prop:value={props.value}
		on:input={event => {
			props.value.value = (event.target as HTMLInputElement).value;
		}}
	/>;
}
