import { deriveContext, extract } from "@mxjp/gluon";
import { Bench, Group, offscreen } from "./common";

function utilization(name: string, injectCount: number, extractCount: number, sampleSize: number) {
	return new Bench(name, () => {
		const extractKeyLimit = injectCount * 2;
		return offscreen({
			sampleSize,
			cycle() {
				return deriveContext(ctx => {
					for (let i = 0; i < injectCount; i++) {
						ctx.set(`key${i}`, "Test Value");
					}
					for (let i = 0; i < extractCount; i++) {
						extract(`key${i % extractKeyLimit}`);
					}
				});
			},
		});
	});
}

export const contextGroup = new Group("Context", [
	utilization("Low Utilization", 1, 10, 100_000),
	utilization("Medium Utilization", 5, 100, 10_000),
	utilization("High Utilization", 20, 1000, 1000),
]);
