import { IndexFor, Inject, Nest, mount, sig } from "@mxjp/gluon";
import { Async, TASKS, Tasks } from "@mxjp/gluon/async";
import { Column } from "./components/column";
import classes from "./main.module.css";

await new Promise(resolve => {
	window.addEventListener("DOMContentLoaded", resolve);
});

const exampleNames: string[] = [
	"counter",
	"data-binding",
	"stopwatch",
	"routing",
	"movable",
	"custom-view",
	"render-to-string",
	"benchmark",
];

const route = sig(location.hash.slice(1));
window.addEventListener("hashchange", () => {
	route.value = location.hash.slice(1);
});

interface ExampleModule {
	example(): unknown;
}

function ExampleView(props: { name: string }) {
	return <Column>
		<h1>{props.name}</h1>
		<a
			href={`https://github.com/mxjp/gluon/blob/main/examples/src/example-${props.name}.tsx`}
			target="_blank"
			referrerpolicy="no-referrer"
		>view source</a>
		<Async<ExampleModule>
			source={() => import(`./example-${props.name}.tsx`)}
			pending={() => "Loading example..."}
		>
			{module => <module.example />}
		</Async>
	</Column>;
}

mount(
	document.body,
	<Inject key={TASKS} value={new Tasks()}>
		{() => {
			return <div class={classes.app}>
				<div class={classes.area}>
					<div class={classes.menu}>
						<h1>gluon! examples</h1>
						<div class={classes.menuItems}>
							<IndexFor each={exampleNames}>
								{name => (
									<a href={`#${name}`}>{name}</a>
								)}
							</IndexFor>
						</div>
					</div>
				</div>
				<div class={classes.area}>
					<div class={classes.view}>
						<Nest>
							{() => {
								const name = route.value;
								if (exampleNames.includes(name)) {
									return () => <ExampleView name={name} />;
								}
							}}
						</Nest>
					</div>
				</div>
			</div>;
		}}
	</Inject>
);
