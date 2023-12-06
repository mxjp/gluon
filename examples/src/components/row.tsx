import classes from "./row.module.css";

export function Row(props: { children?: unknown }) {
	return <div class={classes.row}>
		{props.children}
	</div>;
}
