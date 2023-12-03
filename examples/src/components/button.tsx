
export function button(content: unknown, action: () => void) {
	return <button $click={event => {
		event.stopPropagation();
		event.preventDefault();
		action();
	}}>
		{content}
	</button>;
}
