import { Inject, Iter, Nest, TASKS, Tasks, Unwrap, mount, sig } from "@mxjp/gluon";
import { Column } from "./components/column";
import hljs from 'highlight.js';
import typescript from 'highlight.js/lib/languages/typescript';

import classes from "./main.module.css";

hljs.registerLanguage('tsx', typescript);

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
		<Unwrap<ExampleModule>
			source={() => import(`./example-${props.name}.tsx`)}
			pending={() => "Loading example..."}
		>
			{module => <module.example />}
		</Unwrap>
		<Unwrap<any>
			source={() => import(`./example-${props.name}.tsx?raw`)}
			pending={() => "Loading source code..."}
		>
			{source => {
				const res = hljs.highlight(source.default, { language: "tsx", ignoreIllegals: true });
				return <div class={classes.source} prop:innerHTML={res.value}></div>;
			}}
		</Unwrap>
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
