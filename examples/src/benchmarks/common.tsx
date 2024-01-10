import { sig } from "@mxjp/gluon";

export interface BenchResult {
	samples: number;
	mean: number;
	deviation: number;
	ops: number;
	time: number;
	gcs: number;
}

export interface BenchJson extends BenchResult {
	name: string;
}

function wait(delay: number) {
	return new Promise(r => setTimeout(r, delay));
}

export type Status = {
	type: "none" | "running" | "failed";
} | {
	type: "done";
	result: BenchResult;
};

export interface GroupJson {
	name: string;
	items: (GroupJson | BenchJson)[];
}

export class Group {
	constructor(
		public name: string,
		public items: (Group | Bench)[],
	) {}

	async run() {
		for (const item of this.items) {
			await item.run();
		}
	}

	get hasResults(): boolean {
		return this.items.some(item => item.hasResults);
	}

	toJSON(): GroupJson {
		return {
			name: this.name,
			items: this.items
				.filter(i => i.hasResults)
				.map(i => i.toJSON()),
		};
	}
}

export class Bench {
	#status = sig<Status>({ type: "none" });
	#run: () => Promise<BenchResult>;

	constructor(
		public name: string,
		run: () => Promise<BenchResult>,
	) {
		this.#run = run;
	}

	get status() {
		return this.#status.value;
	}

	async run() {
		this.#status.value = { type: "running" };
		try {
			const result = await this.#run();
			this.#status.value = { type: "done", result };
		} catch (error) {
			console.error(error);
			this.#status.value = { type: "failed" };
		}
	}

	get hasResults(): boolean {
		return this.#status.value.type === "done";
	}

	toJSON(): BenchJson {
		const status = this.#status.value;
		if (status.type !== "done") {
			throw new Error("no result");
		}
		return {
			name: this.name,
			...status.result,
		};
	}
}

export interface BenchModule {
	run(): Promise<BenchResult> | BenchResult;
}

export async function offscreen(options: {
	cycle: () => void;
	sampleSize?: number;
	warmupTime?: number;
	time?: number;
	cooldown?: number;
}): Promise<BenchResult> {
	const {
		cycle,
		sampleSize = 100_000,
		warmupTime = 100,
		time = 3_000,
		cooldown = 100,
	} = options;
	await wait(100);
	await bench(cycle, sampleSize, warmupTime);
	const result = await bench(cycle, sampleSize, time);
	await wait(cooldown);
	return result;
}

async function bench(cycle: () => void, sampleSize: number, targetTime: number): Promise<BenchResult> {
	let time = 0;
	let samples: number[] = [];
	while (time < targetTime) {
		const start = performance.now();
		for (let i = 0; i < sampleSize; i++) {
			cycle();
		}
		const sample = performance.now() - start;
		samples.push(sample);
		time += sample;
		await Promise.resolve();
	}

	const allSamples = samples.length;
	const gcLimit = Math.min(...samples) * 2;
	samples = samples.filter(s => s < gcLimit);
	time = samples.reduce((a, s) => a + s, 0);

	const mean = time / samples.length;
	const deviation = Math.sqrt(samples.reduce((a, s) => a + Math.pow(s - mean, 2), 0) / samples.length);

	return {
		samples: samples.length,
		mean: mean / 1000,
		deviation: deviation / mean,
		ops: samples.length * sampleSize,
		time: time / 1000,
		gcs: allSamples - samples.length,
	};
}
