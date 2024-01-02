import { sig } from "@mxjp/gluon";

export interface BenchResult {
	time: number;
	ops: number;
	samples: number;
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
}

export class Bench {
	#status = sig<Status>({ type: "none" });

	constructor(
		public name: string,
		public module: () => Promise<BenchModule>,
	) {}

	get status() {
		return this.#status.value;
	}

	async run() {
		this.#status.value = { type: "running" };
		try {
			await wait(100);
			const module = await this.module();
			const result = await module.run();
			this.#status.value = { type: "done", result };
		} catch (error) {
			console.error(error);
			this.#status.value = { type: "failed" };
		}
	}
}

export interface BenchModule {
	run(): Promise<BenchResult> | BenchResult;
}

export function offscreenSync(options: {
	cycle: () => void;
	sampleSize?: number;
	warmupTime?: number;
	time?: number;
}): BenchResult {
	const {
		cycle,
		sampleSize = 1_000_000,
		warmupTime = 100,
		time = 3_000,
	} = options;
	benchSync(cycle, sampleSize, warmupTime);
	return benchSync(cycle, sampleSize, time);
}

function benchSync(cycle: () => void, sampleSize: number, targetTime: number): BenchResult {
	let time = 0;
	let samples = 0;
	while (time < targetTime) {
		const start = performance.now();
		for (let i = 0; i < sampleSize; i++) {
			cycle();
		}
		time += performance.now() - start;
		samples++;
	}
	return { time, ops: samples * sampleSize, samples };
}
