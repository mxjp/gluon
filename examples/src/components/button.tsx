import { Expression, get, isPending, waitFor } from "@mxjp/gluon";

export function Button(props: {
	children?: unknown;
	action: () => void | Promise<void>;
	asText?: boolean;
	disabled?: Expression<boolean>;
}) {
	const disabled = () => get(props.disabled) || isPending();
	return <button
		class={{
			asText: props.asText,
		}}
		disabled={disabled}
		$click={event => {
			if (disabled()) {
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
