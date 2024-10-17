import { unwrap, wrapInstancesOf } from "rvx/store";

export class WrapTest {
	static {
		wrapInstancesOf(this);
	}

	get wrapped(): boolean {
		return this !== unwrap(this);
	}
}
