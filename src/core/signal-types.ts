
/**
 * A function that is stored inside any accessed signals alongside a cycle.
 */
export interface DependantFn {
	(cycle: number): void;
}

/**
 * A pair of dependant function and the cycle it was captured at.
 */
export type Dependant = [fn: DependantFn, cycle: number];
