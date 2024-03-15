import { Inject, capture, mount } from "@mxjp/gluon";
import { ASYNC, Async, AsyncContext } from "@mxjp/gluon/async";
import { Box } from "./components/box";

async function renderToString(root: () => unknown) {
	// Create an async context for tracking "<Async>" parts:
	const context = new AsyncContext();

	// Create an arbitrary element to render into:
	const host = <div /> as HTMLDivElement;

	const dispose = capture(() => {
		// Render and append content to the host element:
		mount(host, <Inject key={ASYNC} value={context}>
			{root}
		</Inject>);
	});

	try {
		// Wait for all async parts to complete:
		await context.complete();

		// Capture the current HTML:
		return host.innerHTML;

	} finally {
		// Run teardown hooks:
		dispose();
	}
}

export function example() {
	return <>
		<div>
			This example shows how content can be rendered to strings either in the browser or using libraries like JSDOM.
		</div>
		<Async
			source={renderToString(() => {
				return <>
					<h1>Hello World!</h1>
					<Async source={new Promise(r => void setTimeout(r, 500))}>
						{() => <div>This part was rendered asynchronously.</div>}
					</Async>
				</>;
			})}
			pending={() => "Waiting for async parts to complete..."}
		>
			{value => <Box>
				{value}
			</Box>}
		</Async>
	</>;
}
