
export function Button(props: {
	children?: unknown;
	action: () => void;
}) {
	return <button $click={event => {
		event.stopPropagation();
		event.preventDefault();
		props.action();
	}}>
		{props.children}
	</button>;
}
