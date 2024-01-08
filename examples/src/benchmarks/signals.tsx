import { Signal, batch, sig, watch } from "@mxjp/gluon";
import { Bench, Group, offscreenSync } from "./common";

export const signalsGroup = new Group("Signals", [
	new Bench("Watch 100x signals & batch update 3x", () => {
		return offscreenSync({
			sampleSize: 1_000,
			cycle() {
				const sigs: Signal<number>[] = [];
				for (let i = 0; i < 100; i++) {
					sigs.push(sig(i));
				}
				watch(() => {
					for (let i = 0; i < sigs.length; i++) {
						sigs[i].access();
					}
				}, () => {});
				for (let x = 0; x < 3; x++) {
					batch(() => {
						for (let i = 0; i < sigs.length; i++) {
							sigs[i].value++;
						}
					});
				}
			},
		});
	}),

	new Bench("Watch signal 100x times & update 3x", () => {
		return offscreenSync({
			sampleSize: 1_000,
			cycle() {
				const signal = sig(0);
				for (let i = 0; i < 100; i++) {
					watch(signal, () => {});
				}
				for (let i = 0; i < 3; i++) {
					signal.value++;
				}
			},
		});
	}),
]);
