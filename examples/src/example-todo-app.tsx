import { For, Show, effect, sig } from "@mxjp/gluon";
import { reflect, wrap } from "@mxjp/gluon/store";
import { Button } from "./components/button";
import { Row } from "./components/row";
import { TextInput } from "./components/text-input";

const STORAGE_KEY = "gluon-example-todo-app";

export function example() {
	const name = sig("");

	// "wrap" creates a deep reactive wrapper:
	const data = wrap<Data>(JSON.parse(sessionStorage.getItem(STORAGE_KEY)!) ?? {
		items: [],
	});

	effect(() => {
		// Since JSON.stringify accesses every part of data,
		// this effect will re-run every time anything changes:
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	});

	return <>
		<div>
			This is a basic todo app with browser backed storage to demonstrate the use of deeply reactive objects.
		</div>
		<Row>
			<TextInput value={name} />
			<Button action={() => {
				if (name.value.length > 0) {
					data.items.push({ name: name.value, done: false });
					name.value = "";
				}
			}}>Add</Button>
		</Row>
		<ul>
			<For each={data.items}>
				{item => <li>
					<Row>
						{/* "reflect" creates a signal that reflects the value of a reactive property: */}
						<TextInput value={reflect(item, "name")} />
						<Show when={() => item.done} else={() => <>
							<Button action={() => { item.done = true; }}>Done</Button>
						</>}>
							{() => <>
								<Button action={() => { item.done = false; }}>Todo</Button>
								<Button action={() => { data.items.splice(data.items.indexOf(item), 1); }}>Remove</Button>
							</>}
						</Show>
					</Row>
				</li>}
			</For>
		</ul>
		<pre>Current data: {() => JSON.stringify(data, null, "  ")}</pre>
	</>;
}

interface Data {
	items: Item[];
}

interface Item {
	name: string;
	done: boolean;
}
