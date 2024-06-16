/*

# Counter
A simple counter to demonstrate basic signal usage.

*/

import { sig } from "@mxjp/gluon";

export function Example() {
	const count = sig(0);
	return <button $click={() => { count.value++ }}>
		Clicked {count} {() => count.value === 1 ? "time" : "times"}!
	</button>;
}
