import { Inject, Iter, Nest, Tasks, When, mount, sig } from "@mxjp/gluon";
import { Column } from "./components/column";

import classes from "./main.module.css";

await new Promise(resolve => {
	window.addEventListener("DOMContentLoaded", resolve);
});

const exampleNames: string[] = [
	"counter",
	"input",
	"stopwatch",
	"routing",
	"movable",
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
	const module = sig<ExampleModule | null>(null);
	import(`./example-${props.name}.tsx`).then(instance => {
		module.value = instance;
	});

	return <Column>
		<h1>{props.name}</h1>
		<a
			href={`https://github.com/mxjp/gluon/blob/main/examples/src/example-${props.name}.tsx`}
			target="_blank"
			referrerpolicy="no-referrer"
		>view source</a>

		<When value={module}>
			{module => <module.example />}
		</When>
	</Column>;
}

mount(
	document.body,
	<Inject value={new Tasks()}>
		{() => {
			return <div class={classes.app}>
				<div class={classes.area}>
					<div class={classes.menu}>
						<h1>gluon! examples</h1>
						<div class={classes.menuItems}>
							<Iter each={exampleNames}>
								{name => (
									<a href={`#${name}`}>{name}</a>
								)}
							</Iter>
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
