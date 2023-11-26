
export type ContextValueFor<K> = K extends (new(...args: any) => infer T) ? T : unknown;
export type ContextPairFor<K> = [K, ContextValueFor<K>] | (K extends (new(...args: any) => infer V) ? V : never);

export interface ReadonlyContext {
	get<K>(key: K): ContextValueFor<K> | undefined;
	has(key: unknown): boolean;
	readonly size: number;
}

export interface Context extends ReadonlyContext {
	clear(): void;
	delete(key: unknown): boolean;
	set<K>(key: K, value: ContextValueFor<K>): void;
}

const CONTEXT_STACK: (ReadonlyContext | undefined)[] = [];

export function getContext(): ReadonlyContext | undefined {
	return CONTEXT_STACK[CONTEXT_STACK.length - 1];
}

export function extract<K>(key: K): ContextValueFor<K> | undefined {
	return getContext()?.get(key);
}

export function inject<K, R>(value: ContextPairFor<K>, fn: () => R): R {
	const context = new Map(getContext() as Map<any, any>) as Context;
	if (Array.isArray(value)) {
		context.set(value[0], value[1]);
	} else {
		const constructor = (value as any).constructor;
		if (typeof constructor !== "function") {
			throw new TypeError("value must have a constructor");
		}
		context.set(constructor, value);
	}
	return runInContext(context, fn);
}

export function deriveContext<R>(fn: (context: Context) => R): R {
	const context = new Map(getContext() as Map<any, any>) as Context;
	return runInContext(context, () => fn(context));
}

export function runInContext<R>(context: ReadonlyContext | undefined, fn: () => R): R {
	CONTEXT_STACK.push(context);
	try {
		return fn();
	} finally {
		CONTEXT_STACK.pop();
	}
}
