/*

# Render To String
This example shows how to render a gluon component to HTML.

*/

import { Inject, captureSelf, render } from "@mxjp/gluon";
import { ASYNC, Async, AsyncContext } from "@mxjp/gluon/async";

async function renderToString(root: () => unknown): Promise<string> {
	// Capture teardown hooks for disposing after rendering:
	return captureSelf(async dispose => {
		try {
			// Create an async context for awaiting "<Async>" parts:
			const context = new AsyncContext();

			// Create an arbitrary "host" element to render into:
			const host = <div /> as Element;

			// Render into the host element:
			const view = render(<Inject key={ASYNC} value={context}>{root}</Inject>);
			host.appendChild(view.take());

			// Wait for all "<Async>" parts:
			await context.complete();

			// Return the final HTML:
			return host.innerHTML;
		} finally {
			// Run captured teardown hooks:
			dispose();
		}
	});
}

export function Example() {
	return <Async
		source={renderToString(() => <>
			<h1>Hello World!</h1>

			{/* The "renderToString" function will wait for this part: */}
			<Async source={new Promise(r => setTimeout(r, 2000))}>
				{() => <>This has been rendered asynchronously.</>}
			</Async>
		</>)}
		pending={() => <>Rendering...</>}
	>
		{html => <pre><code>{html}</code></pre>}
	</Async>;
}
