import { unwrap, wrapInstancesOf } from "@mxjp/gluon/store";

export class WrapTest {
	static {
		wrapInstancesOf(this);
	}

	get wrapped(): boolean {
		return this !== unwrap(this);
	}
}
