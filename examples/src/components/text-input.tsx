import { Signal } from "@mxjp/gluon";

export function TextInput(props: { value: Signal<string> }) {
	return <input
		type="text"
		value={props.value}
		$input={event => {
			props.value.value = (event.target as HTMLInputElement).value;
		}}
	/>;
}
