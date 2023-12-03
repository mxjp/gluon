import { sig } from "@mxjp/gluon";
import { row } from "./components/row";

export function example() {
	const count = sig(0);

	return <>
		<div>A simple counter to deminstrate basic signals.</div>
		{row(
			<button $click={() => count.value++}>
				Clicked {count} {() => count.value === 1 ? "time" : "times"}!
			</button>
		)}
	</>;
}
