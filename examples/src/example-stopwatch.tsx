import { Expression, get, iter, lazy, sig, stylesheet, teardown, when } from "@mxjp/gluon";
import { button } from "./components/button";
import { row } from "./components/row";

const [classes] = stylesheet(`
	.timer {
		font-size: 3rem;
	}

	.punct {
		color: var(--accent);
	}

	.ms {
		font-size: max(.5em, 1rem);
		position: relative;
		color: var(--fg-secondary);
	}
`);

export function example() {
	const timer = createTimer();
	return <>
		<div>A proper stopwatch that doesn't drift over time. This example also demonstrates how state and logic can be separated from it's representation.</div>

		<div class={classes.timer}>
			{timeText(timer.elapsed)}
		</div>

		{row(<>
			{when(timer.running, () => <>
				{button("Stop", timer.stop)}
				{button("Lap", timer.lap)}
			</>, () => <>
				{button("Start", timer.start)}
				{button("Reset", timer.reset)}
			</>)}
		</>)}

		<ul>
			{iter(timer.laps, (lap, index) => {
				return <li>
					Lap {index + 1}: {timeText(lap.lap)}
				</li>;
			})}
		</ul>
	</>;
}

function timeText(elapsed: Expression<number>, sub = true) {
	return <>
		{when(() => {
			const hours = Math.floor(get(elapsed) / 1000 / 60 / 60);
			if (hours > 0) {
				return String(hours);
			}
		}, hours => <>
			{hours}
			<span class={classes.punct}>:</span>
		</>)}
		{() => String(Math.floor(get(elapsed) / 1000 / 60) % 60)}
		<span class={classes.punct}>:</span>
		{() => String(Math.floor(get(elapsed) / 1000) % 60).padStart(2, "0")}
		<span class={classes.ms}>
			<span class={classes.punct}>.</span>
			{() => String(Math.floor(get(elapsed)) % 1000).padStart(3, "0")}
		</span>
	</>;
}

interface Lap {
	lap: number;
	elapsed: number;
}

function createTimer() {
	type State = {
		type: "paused",
		elapsed: number,
		lastLap: number,
	} | {
		type: "running",
		started: number,
		lastLap: number,
	};

	const now = sig(performance.now());
	const laps = sig<Lap[]>([]);
	const state = sig<State>({
		type: "paused",
		elapsed: 0,
		lastLap: 0,
	});

	let nextFrame = requestAnimationFrame(function update() {
		nextFrame = requestAnimationFrame(update);
		now.value = performance.now();
	});
	teardown(() => cancelAnimationFrame(nextFrame));

	const elapsed = lazy(() => {
		switch (state.value.type) {
			case "paused": return state.value.elapsed;
			case "running": return now.value - state.value.started;
		}
	});

	return {
		running: () => state.value.type === "running",
		laps: () => laps.value,
		elapsed,

		start: () => {
			if (state.value.type === "paused") {
				state.value = {
					type: "running",
					started: now.value - state.value.elapsed,
					lastLap: state.value.lastLap,
				};
			}
		},

		stop: () => {
			if (state.value.type === "running") {
				state.value = {
					type: "paused",
					elapsed: elapsed(),
					lastLap: state.value.lastLap,
				};
			}
		},

		lap: () => {
			const lap = elapsed() - state.value.lastLap;
			if (lap > 0) {
				state.value.lastLap = elapsed();
				laps.update(laps => {
					laps.push({
						lap,
						elapsed: elapsed(),
					});
				});
			}
		},

		reset: () => {
			laps.value = [];
			state.value = {
				type: "paused",
				elapsed: 0,
				lastLap: 0,
			};
		},
	};
}
