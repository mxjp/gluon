/*

# Todo App (Store API)
This is a basic todo app with browser backed storage using only gluon's store API.

Note, that this example doesn't include any storage error handling or validation.

*/

import { For, Show, Signal, effect, sig } from "@mxjp/gluon";
import { reflect, wrap } from "@mxjp/gluon/store";

const STORAGE_KEY = "gluon-examples:todo-app";

export function Example() {
	const name = sig("");

	// Load items from storage by creating a
	// deep reactive wrapper for the items array:
	let items: Item[];
	try {
		items = wrap(JSON.parse(localStorage.getItem(STORAGE_KEY)!));
	} catch (error) {
		items = wrap([]);
		console.error(error);
	}

	function add() {
		if (name.value) {
			// Since "items" is a reactive wrapper, it can be modified directly:
			items.push({ name: name.value, done: false });
			name.value = "";
		}
	}

	effect(() => {
		try {
			// "JSON.stringify" accesses all reactive properties of
			// "items" and will re-run this effect when anything changes:
			localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
		} catch (error) {
			console.error(error);
		}
	});

	return <div class="column">
		<div class="row">
			<TextInput value={name} action={add} />
			<button $click={add}>Add</button>
		</div>
		<ul>
			<For each={items}>
				{item => <li class="row">
					<TextInput value={reflect(item, "name")} />
					<Show
						when={() => item.done}
						else={() => <>
							<button $click={() => { item.done = true }}>Done</button>
						</>}
					>
						{() => <>
							<button $click={() => { item.done = false }}>Undone</button>
							<button $click={() => {
								items.splice(items.indexOf(item), 1);
							}}>Remove</button>
						</>}
					</Show>
				</li>}
			</For>
		</ul>
	</div>;
}

function TextInput(props: {
	value: Signal<string>;
	action?: () => void;
}) {
	return <input
		type="text"
		prop:value={props.value}
		$input={event => {
			props.value.value = (event.target as HTMLInputElement).value;
		}}
		$keydown={event => {
			if (event.key === "Enter" && props.action) {
				event.preventDefault();
				props.action();
			}
		}}
	/>;
}

interface Item {
	name: string;
	done: boolean;
}
