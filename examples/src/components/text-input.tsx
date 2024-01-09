import { Signal, StyleValue, isPending } from "@mxjp/gluon";

export function TextInput(props: {
	value: Signal<string>;
	style?: StyleValue;
}) {
	return <input
		type="text"
		prop:value={props.value}
		disabled={isPending}
		style={props.style}
		$input={event => {
			props.value.value = (event.target as HTMLInputElement).value;
		}}
	/>;
}
