# Movable Views
Using views in multiple places at once is not supported and will result in undefined behavior.

When you want to safely reuse, keep alive or move content, you can wrap content as a movable view to automatically remove it from it's previous place when used concurrently.

=== "JSX"
	```jsx
	import { movable, MovableView } from "@mxjp/gluon";

	// Wrap arbitrary content:
	const wrapper = movable(<>Hello World!</>);

	// Wrap an existing view:
	const wrapper = new MovableView(someOtherView);

	// Remove content from all other instances and create a new one:
	const view = wrapper.move();

	// Remove content from all other instances:
	wrapper.detach();
	```

=== "No Build"
	```jsx
	import { movable, MovableView } from "./gluon.js";

	// Wrap arbitrary content:
	const wrapper = movable("Hello World!");

	// Wrap an existing view:
	const wrapper = new MovableView(someOtherView);

	// Remove content from all other instances and create a new one:
	const view = wrapper.move();

	// Remove content from all other instances:
	wrapper.detach();
	```

For instance, this can be used to safely move kept alive content into a specific position:

=== "JSX"
	```jsx
	const wrapper = movable(<>Current item</>);
	const currentIndex = sig(0);

	<For each={items}>
		{(item, index) => {
			return <li>
				{/* Move the view into this item if it's the current one: */}
				<Show when={() => currentIndex.value === index()}>
					{() => wrapper.move()}
				</Show>
			</li>;
		}}
	</For>
	```

=== "No Build"
	```jsx
	const wrapper = movable(<>Current item</>);
	const currentIndex = sig(0);

	For({
		each: items,
		children: (item, index) => e("li").append(
			Show({
				when: () => currentIndex.value === index(),
				children: () => wrapper.move(),
			}),
		),
	})
	```

For just keeping content alive and conditionally rendering it in the same place, consider using [`<Attach>`](./attach.md) instead of movable views.
