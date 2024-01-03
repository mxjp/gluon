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

export interface BenchJson {
	name: string;
	opsPerSec: number;
	samples: number;
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
			opsPerSec: Math.round(status.result.ops / status.result.time),
			samples: status.result.samples,
		};
	}
}

export interface BenchModule {
	run(): Promise<BenchResult> | BenchResult;
}

export async function offscreenSync(options: {
	cycle: () => void;
	sampleSize?: number;
	warmupTime?: number;
	time?: number;
	cooldown?: number;
}): Promise<BenchResult> {
	const {
		cycle,
		sampleSize = 1_000_000,
		warmupTime = 100,
		time = 3_000,
		cooldown = 100,
	} = options;
	await wait(100);
	benchSync(cycle, sampleSize, warmupTime);
	const result = benchSync(cycle, sampleSize, time);
	await wait(cooldown);
	return result;
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
