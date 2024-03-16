import { IndexFor, Nest, Show } from "@mxjp/gluon";
import { Bench, BenchResult, Group } from "./benchmarks/common";
import classes from "./benchmarks/common.module.css";
import { contextGroup } from "./benchmarks/context";
import { renderingGroup } from "./benchmarks/rendering";
import { signalsGroup } from "./benchmarks/signals";
import { Button } from "./components/button";
import { Row } from "./components/row";

export function example() {
	return <>
		<div>This is a collection of performance benchmarks.</div>
		<Row>
			<Button disabled={() => !root.hasResults} action={() => {
				const json = JSON.stringify(root.toJSON().items, null, "\t") + "\n";
				(<a
					href={`data:application/json;base64,${btoa(json)}`}
					download={`bench_${Date.now()}.json`}
				/> as HTMLAnchorElement).click();
			}}>Export JSON</Button>
		</Row>
		<div class={classes.grid}>
			<Entry item={root} indent={0} />
		</div>
	</>;
}

function Result(props: {
	result: BenchResult;
}) {
	const { ops, time, deviation, samples, gcs } = props.result;
	const opsPerSec = Math.round(ops / time);
	const devPercent = Math.round(deviation * 1000) / 1000;
	if (gcs > samples / 3) {
		return `Sample size too low`;
	}
	return `~${opsPerSec} ops/s (samples=${samples}, gcs=${gcs}, deviation=${devPercent}%)`;
}

function Entry(props: {
	item: Bench | Group;
	indent: number;
}) {
	return <>
		<div class={classes.name} style={{
			"--indent": String(props.indent),
		}}>
			<Button asText action={() => props.item.run()}>
				{props.item.name}
			</Button>
		</div>

		<Show when={() => props.item instanceof Bench ? props.item : null}>
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
		</Show>

		<Show when={() => props.item instanceof Group ? props.item : null}>
			{group => <IndexFor each={group.items}>
				{item => <Entry item={item} indent={props.indent + 1} />}
			</IndexFor>}
		</Show>
	</>;
}

const root = new Group("All", [
	renderingGroup,
	signalsGroup,
	contextGroup,
]);
