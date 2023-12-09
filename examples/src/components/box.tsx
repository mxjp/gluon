import classes from "./box.module.css";
import { Column } from "./column";

export function Box(props: {
	children: unknown;
}) {
	return <Column class={classes.box}>
		{props.children}
	</Column>
}
