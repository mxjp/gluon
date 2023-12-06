import classes from "./column.module.css";

export function Column(props: { children?: unknown }) {
	return <div class={classes.column}>
		{props.children}
	</div>;
}
