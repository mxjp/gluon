import { Expression, get } from "@mxjp/gluon";
import classes from "./column.module.css";

export function Column(props: {
	class?: Expression<string>;
	children?: unknown;
}) {
	return <div class={() => `${classes.column} ${get(props.class)}`}>
		{props.children}
	</div>;
}
