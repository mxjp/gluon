import { Signal, isPending } from "@mxjp/gluon";

export function TextInput(props: { value: Signal<string> }) {
	return <input
		type="text"
		prop:value={props.value}
		disabled={isPending}
		$input={event => {
			props.value.value = (event.target as HTMLInputElement).value;
		}}
	/>;
}
