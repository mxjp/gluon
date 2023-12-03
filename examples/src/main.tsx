import { iter, mount, nest, sig, stylesheet, when } from "@mxjp/gluon";
import { loadingMessage } from "./components/loading-message";
import { column } from "./components/column";

await new Promise(resolve => {
	window.addEventListener("DOMContentLoaded", resolve);
});

const examples: string[] = [
	"counter",
	"stopwatch",
];

const [classes] = stylesheet(`
	.app {
		min-height: 100dvh;
		display: grid;
		grid-template-columns: minmax(auto, 20rem) 1fr;
	}

	.area:not(:last-child) {
		border-right: var(--layout-border);
	}

	.area {
		position: relative;
		overflow: auto;
	}

	.menu {
		display: flex;
		flex-direction: column;
		row-gap: 1rem;
	}

	.menuItems {
		display: flex;
		flex-direction: column;
		row-gap: .5rem;
	}

	.menu,
	.view {
		width: 100%;
		position: absolute;
		padding: 1rem;
	}
`);

const route = sig(location.hash.slice(1));
window.addEventListener("hashchange", () => {
	route.value = location.hash.slice(1);
});

interface ExampleModule {
	example(): unknown;
}

function exampleView(name: string) {
	const module = sig<ExampleModule | null>(null);
	import(`./example-${name}.tsx`).then(instance => {
		module.value = instance;
	});
	return column(<>
		<h1>{name}</h1>
		<a
			href={`https://github.com/mxjp/gluon/blob/main/examples/src/example-${name}.tsx`}
			target="_blank"
			referrerpolicy="no-referrer"
		>view source</a>

		{when(module, module => {
			return module.example();
		}, () => {
			return loadingMessage(`Loading example module...`);
		})}
	</>);
}

mount(
	document.body,
	<div class={classes.app}>
		<div class={classes.area}>
			<div class={classes.menu}>
				<h1>gluon! examples</h1>
				<div class={classes.menuItems}>
					{iter(examples, name => {
						return <a href={`#${name}`}>{name}</a>;
					})}
				</div>
			</div>
		</div>
		<div class={classes.area}>
			<div class={classes.view}>
				{nest(() => {
					const name = route.value;
					if (examples.includes(name)) {
						return () => exampleView(name);
					}
				})}
			</div>
		</div>
	</div>,
);
