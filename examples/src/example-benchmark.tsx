import { Iter, Nest, When } from "@mxjp/gluon";
import { Bench, BenchResult, Group } from "./benchmarks/common";
import classes from "./benchmarks/common.module.css";
import { Button } from "./components/button";

export function example() {
	return <>
		<div class={classes.grid}>
			<Entry item={root} indent={0} />
		</div>
	</>;
}

function Result(props: {
	result: BenchResult;
}) {
	const { ops, time, samples } = props.result;
	const opsPerSec = Math.round(ops / time);
	return `~${opsPerSec} ops/s (${samples} samples)`;
}

function Entry(props: {
	item: Bench | Group;
	indent: number;
}) {
	return <>
		<div class={classes.name} style={{
			"--indent": props.indent,
		}}>
			<Button asText action={() => props.item.run()}>
				{props.item.name}
			</Button>
		</div>

		<When value={() => props.item instanceof Bench ? props.item : null}>
			{bench => <div class={classes.status}>
				<Nest>
					{() => {
						const status = bench.status;
						switch (status.type) {
							case "running": return () => "Running...";
							case "done": return () => <Result result={status.result} />;
							case "failed": return () => "Failed.";
						}
					}}
				</Nest>
			</div>}
		</When>

		<When value={() => props.item instanceof Group ? props.item : null}>
			{group => <Iter each={group.items}>
				{item => <Entry item={item} indent={props.indent + 1} />}
			</Iter>}
		</When>
	</>;
}

const root = new Group("All", [
	new Group("Rendering", [
		new Bench("Attribute Prop Test", () => import("./benchmarks/rendering/attr-prop-test")),
		new Bench("Attribute Non-Prop Test", () => import("./benchmarks/rendering/attr-non-prop-test")),
	]),
]);
