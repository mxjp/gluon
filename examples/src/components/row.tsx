import { stylesheet } from "@mxjp/gluon";

const [classes] = stylesheet(`
	.row {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		column-gap: .5rem;
	}
`);

export function row(content: unknown) {
	return <div class={classes.row}>
		{content}
	</div>;
}
