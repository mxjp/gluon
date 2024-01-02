import { isPending, waitFor } from "@mxjp/gluon";

export function Button(props: {
	children?: unknown;
	action: () => void | Promise<void>;
	asText?: boolean;
}) {
	return <button
		class={{
			asText: props.asText,
		}}
		disabled={isPending}
		$click={event => {
			if (isPending()) {
				return;
			}
			event.stopPropagation();
			event.preventDefault();
			const promise = props.action();
			if (promise) {
				waitFor(promise);
			}
		}}
	>
		{props.children}
	</button>;
}
