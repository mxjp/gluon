import { stylesheet } from "@mxjp/gluon";

const [classes] = stylesheet(`
	.column {
		display: flex;
		flex-direction: column;
		row-gap: 1rem;
	}
`);

export function column(content: unknown) {
	return <div class={classes.column}>
		{content}
	</div>;
}
