import { Signal, StyleValue } from "@mxjp/gluon";
import { isPending } from "@mxjp/gluon/async";

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
