const KEY = Symbol.for("gluon:globals");
const GLOBALS = globalThis[KEY] ?? (globalThis[KEY] = {});
GLOBALS.NEXT_ID ??= { value: 0 };
GLOBALS.CONTEXT_STACK ??= [];
GLOBALS.TEARDOWN_STACK ??= [];
GLOBALS.BATCH_STACK ??= [];
GLOBALS.TRACKING_STACK ??= [true];
GLOBALS.TRIGGERS_STACK ??= [[]];
GLOBALS.DEPENDANTS_STACK ??= [[]];
function shareInstancesOf(targetClass, symbolKey) {
	const marker = Symbol.for(symbolKey);
	targetClass.prototype[marker] = true;
	const native = targetClass[Symbol.hasInstance];
	Object.defineProperty(targetClass, Symbol.hasInstance, {
		configurable: true,
		enumerable: false,
		writable: false,
		value: function hasInstance(target) {
			return target?.[marker] ?? native.call(this, target);
		},
	});
}

const { CONTEXT_STACK } = GLOBALS;
function getContext() {
	return CONTEXT_STACK[CONTEXT_STACK.length - 1];
}
function extract(key) {
	return getContext()?.get(key);
}
function inject(key, value, fn) {
	const context = new Map(getContext());
	context.set(key, value);
	return runInContext(context, fn);
}
function deriveContext(fn) {
	const parent = getContext();
	const context = new Map(parent);
	return runInContext(context, () => fn(context, parent));
}
function runInContext(context, fn) {
	CONTEXT_STACK.push(context);
	try {
		return fn();
	} finally {
		CONTEXT_STACK.pop();
	}
}
function wrapContext(fn) {
	const context = getContext();
	return (...args) => {
		CONTEXT_STACK.push(context);
		try {
			return fn(...args);
		} finally {
			CONTEXT_STACK.pop();
		}
	};
}

const { TEARDOWN_STACK } = GLOBALS;
function capture(fn) {
	const hooks = [];
	TEARDOWN_STACK.push(hooks);
	try {
		fn();
	} finally {
		TEARDOWN_STACK.pop();
	}
	if (hooks.length === 0) {
		return () => {};
	}
	if (hooks.length === 1) {
		return hooks[0];
	}
	return () => {
		for (let i = 0; i < hooks.length; i++) {
			hooks[i]();
		}
	};
}
function captureSelf(fn) {
	let disposed = false;
	let dispose = undefined;
	let value;
	dispose = capture(() => {
		value = fn(() => {
			disposed = true;
			dispose?.();
		});
	});
	if (disposed) {
		dispose();
	}
	return value;
}
function uncapture(fn) {
	TEARDOWN_STACK.push(undefined);
	try {
		return fn();
	} finally {
		TEARDOWN_STACK.pop();
	}
}
function teardown(hook) {
	TEARDOWN_STACK[TEARDOWN_STACK.length - 1]?.push(hook);
}

const { BATCH_STACK, TRACKING_STACK, TRIGGERS_STACK, DEPENDANTS_STACK } = GLOBALS;
function access(stack, map) {
	const top = stack[stack.length - 1];
	for (let i = 0; i < top.length; i++) {
		const [fn, cycle] = top[i];
		map.set(fn, cycle);
	}
}
function notify(top) {
	for (let i = 0; i < top.length; i++) {
		const [fn, cycle] = top[i];
		fn(cycle);
	}
}
function callDependant(cycle, fn) {
	fn(cycle);
}
class Signal {
	static {
		shareInstancesOf(this, "gluon:signal_instance");
	}
	#value;
	#equals;
	#triggers = new Map();
	#dependants = new Map();
	constructor(value, equals = true) {
		this.#value = value;
		this.#equals = typeof equals === "function" ? equals : equals ? (a, b) => a === b : () => false;
	}
	get value() {
		this.access();
		return this.#value;
	}
	set value(value) {
		if (!this.#equals(this.#value, value)) {
			this.#value = value;
			this.notify();
		}
	}
	update(fn) {
		if (fn(this.#value) !== false) {
			this.notify();
		}
	}
	access() {
		if (TRACKING_STACK[TRACKING_STACK.length - 1]) {
			access(TRIGGERS_STACK, this.#triggers);
			access(DEPENDANTS_STACK, this.#dependants);
		}
	}
	notify() {
		const triggers = this.#triggers;
		this.#triggers = new Map();
		triggers.forEach(callDependant);
		const dependants = this.#dependants;
		if (BATCH_STACK.length > 0) {
			BATCH_STACK[BATCH_STACK.length - 1].push(...dependants);
			dependants.clear();
		} else {
			this.#dependants = new Map();
			dependants.forEach(callDependant);
		}
	}
}
function sig(value, equals) {
	return new Signal(value, equals);
}
function watch(expr, fn, trigger = false) {
	if (expr instanceof Signal || typeof expr === "function") {
		const context = getContext();
		let disposed = false;
		let disposeFn;
		let cycle = 0;
		let value;
		let runExpr;
		if (expr instanceof Signal) {
			runExpr = () => {
				value = expr.value;
			};
		} else {
			runExpr = wrapContext(() => {
				value = expr();
			});
		}
		const runFn = () => fn(value);
		(function dependant(accessedCycle) {
			if (disposed || cycle !== accessedCycle) {
				return;
			}
			cycle++;
			runInContext(context, () => {
				const dependants = [[dependant, cycle]];
				TRIGGERS_STACK.push(trigger ? dependants : []);
				DEPENDANTS_STACK.push(trigger ? [] : dependants);
				try {
					uncapture(runExpr);
				} finally {
					TRIGGERS_STACK.pop();
					DEPENDANTS_STACK.pop();
				}
				disposeFn?.();
				disposeFn = capture(runFn);
			});
		})(cycle);
		teardown(() => {
			disposed = true;
			disposeFn?.();
		});
	} else {
		fn(expr);
	}
}
function trigger(expr, fn, cycle = 0) {
	if (expr instanceof Signal || typeof expr === "function") {
		const triggers = TRIGGERS_STACK[TRIGGERS_STACK.length - 1];
		triggers.push([cycle => uncapture(() => fn(cycle)), cycle]);
		try {
			if (expr instanceof Signal) {
				return expr.value;
			}
			return expr();
		} finally {
			triggers.pop();
		}
	} else {
		return expr;
	}
}
function batch(fn) {
	const batch = [];
	BATCH_STACK.push(batch);
	let value;
	try {
		value = fn();
	} finally {
		BATCH_STACK.pop();
	}
	notify(batch);
	return value;
}
function memo(expr, equals) {
	const signal = sig(undefined, equals);
	watch(
		expr,
		value => {
			signal.value = value;
		},
		true,
	);
	return () => signal.value;
}
function lazy(expr) {
	let value;
	let current = false;
	let proxyMap = new Map();
	const proxy = [
		accessedCycle => {
			if (proxy[1] === accessedCycle) {
				proxy[1]++;
				const map = proxyMap;
				proxyMap = new Map();
				map.forEach(callDependant);
			}
		},
		0,
	];
	let cycle = 0;
	return () => {
		access(DEPENDANTS_STACK, proxyMap);
		if (!current) {
			current = true;
			DEPENDANTS_STACK.push([proxy]);
			try {
				value = trigger(
					expr,
					accessedCycle => {
						if (cycle === accessedCycle) {
							cycle++;
							current = false;
						}
					},
					cycle,
				);
			} finally {
				DEPENDANTS_STACK.pop();
			}
		}
		return value;
	};
}
function untrack(fn) {
	TRACKING_STACK.push(false);
	try {
		return fn();
	} finally {
		TRACKING_STACK.pop();
	}
}
function track(fn) {
	TRACKING_STACK.push(true);
	try {
		return fn();
	} finally {
		TRACKING_STACK.pop();
	}
}
function get(expr) {
	if (expr instanceof Signal) {
		return expr.value;
	}
	if (typeof expr === "function") {
		return expr();
	}
	return expr;
}
function map(input, mapFn) {
	if (input instanceof Signal) {
		return () => mapFn(input.value);
	}
	if (typeof input === "function") {
		return () => mapFn(input());
	}
	return mapFn(input);
}
function string(input) {
	return map(input, value => String(value));
}
function optionalString(input) {
	return map(input, value => {
		if (value === null || value === undefined) {
			return value;
		}
		return String(value);
	});
}

class View {
	static {
		shareInstancesOf(this, "gluon:view_instance");
	}
	#first;
	#last;
	#owner;
	constructor(init) {
		init((first, last) => {
			if (first) {
				this.#first = first;
			}
			if (last) {
				this.#last = last;
			}
			this.#owner?.(this.#first, this.#last);
		}, this);
		if (!this.#first || !this.#last) {
			throw new Error("incomplete boundary");
		}
	}
	get first() {
		return this.#first;
	}
	get last() {
		return this.#last;
	}
	get parent() {
		return this.#first?.parentNode ?? undefined;
	}
	setBoundaryOwner(owner) {
		if (this.#owner !== undefined) {
			throw new Error("boundary owner is already set");
		}
		this.#owner = owner;
		teardown(() => {
			this.#owner = undefined;
		});
	}
	take() {
		if (this.#first === this.#last) {
			return this.#first;
		}
		const range = new Range();
		range.setStartBefore(this.#first);
		range.setEndAfter(this.#last);
		return range.extractContents();
	}
	detach() {
		if (this.#first === this.#last) {
			this.#first.parentNode?.removeChild(this.#first);
		} else {
			const range = new Range();
			range.setStartBefore(this.#first);
			range.setEndAfter(this.#last);
			range.extractContents();
		}
	}
}
function* viewNodes(view) {
	let node = view.first;
	for (;;) {
		yield node;
		if (node === view.last) {
			break;
		}
		node = node.nextSibling;
	}
}
function nest(expr) {
	return new View((setBoundary, self) => {
		watch(expr, value => {
			const view = render(value?.());
			const parent = self.parent;
			if (parent) {
				parent.insertBefore(view.take(), self.first);
				self.detach();
			}
			setBoundary(view.first, view.last);
			view.setBoundaryOwner(setBoundary);
		});
	});
}
function when(value, thenFn, elseFn) {
	const getValue = memo(value);
	return nest(() => {
		const value = getValue();
		if (value) {
			return () => thenFn(value);
		}
		return elseFn;
	});
}
function iterUnique(expr, content) {
	return new View((setBoundary, self) => {
		function detach(instances) {
			for (let i = 0; i < instances.length; i++) {
				instances[i].view.detach();
			}
		}
		let cycle = 0;
		const instances = [];
		const instanceMap = new Map();
		const first = document.createComment("g");
		setBoundary(first, first);
		teardown(() => {
			for (let i = 0; i < instances.length; i++) {
				instances[i].dispose();
			}
		});
		watch(expr, values => {
			let parent = self.parent;
			if (!parent) {
				parent = document.createDocumentFragment();
				parent.appendChild(first);
			}
			let index = 0;
			let last = first;
			for (const value of values) {
				let instance = instances[index];
				if (instance && instance.value === value) {
					instance.cycle = cycle;
					instance.index.value = index;
					last = instance.view.last;
					index++;
				} else {
					instance = instanceMap.get(value);
					if (instance === undefined) {
						const instance = {
							value,
							cycle,
							index: sig(index),
							dispose: undefined,
							view: undefined,
						};
						instance.dispose = capture(() => {
							instance.view = render(content(value, () => instance.index.value));
							instance.view.setBoundaryOwner((_, last) => {
								if (instances[instances.length - 1] === instance && instance.cycle === cycle) {
									setBoundary(undefined, last);
								}
							});
						});
						const next = last.nextSibling;
						if (next) {
							parent.insertBefore(instance.view.take(), next);
						} else {
							parent.appendChild(instance.view.take());
						}
						instances.splice(index, 0, instance);
						instanceMap.set(value, instance);
						last = instance.view.last;
						index++;
					} else if (instance.cycle !== cycle) {
						instance.index.value = index;
						instance.cycle = cycle;
						const currentIndex = instances.indexOf(instance, index);
						if (currentIndex < 0) {
							detach(instances.splice(index, instances.length - index, instance));
							const next = last.nextSibling;
							if (next) {
								parent.insertBefore(instance.view.take(), next);
							} else {
								parent.appendChild(instance.view.take());
							}
						} else {
							detach(instances.splice(index, currentIndex - index));
						}
						last = instance.view.last;
						index++;
					}
				}
			}
			if (instances.length > index) {
				detach(instances.splice(index));
			}
			for (const [value, instance] of instanceMap) {
				if (instance.cycle !== cycle) {
					instanceMap.delete(value);
					instance.view.detach();
					instance.dispose();
				}
			}
			cycle++;
			if (last !== self.last) {
				setBoundary(undefined, last);
			}
		});
	});
}
function iter(expr, content) {
	return new View((setBoundary, self) => {
		const first = document.createComment("g");
		setBoundary(first, first);
		const instances = [];
		watch(expr, values => {
			let parent = self.parent;
			if (!parent) {
				parent = document.createDocumentFragment();
				parent.appendChild(first);
			}
			let index = 0;
			let last = first;
			for (const value of values) {
				if (index < instances.length) {
					const current = instances[index];
					if (current.value === value) {
						last = current.view.last;
						index++;
						continue;
					}
					current.view.detach();
					current.dispose();
				}
				const instance = {
					value,
					dispose: undefined,
					view: undefined,
				};
				instance.dispose = capture(() => {
					instance.view = render(content(value, index));
					instance.view.setBoundaryOwner((_, last) => {
						if (instances[instances.length - 1] === instance) {
							setBoundary(undefined, last);
						}
					});
				});
				const next = last.nextSibling;
				if (next) {
					parent.insertBefore(instance.view.take(), next);
				} else {
					parent.appendChild(instance.view.take());
				}
				instances[index] = instance;
				last = instance.view.last;
				index++;
			}
			if (instances.length > index) {
				for (let i = index; i < instances.length; i++) {
					const instance = instances[i];
					instance.view.detach();
					instance.dispose();
				}
				instances.length = index;
			}
			if (self.last !== last) {
				setBoundary(undefined, last);
			}
		});
	});
}
class MovableView {
	#view;
	#dispose = undefined;
	constructor(view) {
		this.#view = view;
	}
	move() {
		return new View((setBoundary, self) => {
			this.#dispose?.();
			this.#dispose = capture(() => {
				setBoundary(this.#view.first, this.#view.last);
				this.#view.setBoundaryOwner(setBoundary);
				teardown(() => {
					const anchor = document.createComment("g");
					const parent = self.parent;
					if (parent) {
						parent.insertBefore(anchor, self.first);
						self.detach();
					}
					setBoundary(anchor, anchor);
				});
			});
		});
	}
	detach() {
		this.#dispose?.();
		this.#dispose = undefined;
	}
}
function movable(content) {
	return new MovableView(render(content));
}
function show(expr, content) {
	const inner = render(content);
	const show = memo(() => Boolean(get(expr)));
	return nest(() => {
		return show() ? () => inner : () => document.createComment("g");
	});
}

function createText(expr) {
	const text = document.createTextNode("");
	watch(expr, value => {
		text.textContent = String(value ?? "");
	});
	return text;
}
function render(content) {
	if (content instanceof View) {
		return content;
	}
	return new View((setBoundary, self) => {
		if (Array.isArray(content)) {
			const flat = content.flat(Infinity);
			if (flat.length > 1) {
				const parent = document.createDocumentFragment();
				for (let i = 0; i < flat.length; i++) {
					const part = flat[i];
					if (part === null || part === undefined) {
						parent.appendChild(document.createComment("g"));
					} else if (part instanceof Node) {
						parent.appendChild(part);
					} else if (part instanceof View) {
						parent.appendChild(part.take());
						if (i === 0) {
							part.setBoundaryOwner((first, _) => {
								if (first !== self.first) {
									setBoundary(first, undefined);
								}
							});
						} else if (i === flat.length - 1) {
							part.setBoundaryOwner((_, last) => {
								if (last !== self.last) {
									setBoundary(undefined, last);
								}
							});
						}
					} else {
						parent.appendChild(createText(part));
					}
				}
				setBoundary(parent.firstChild, parent.lastChild);
				return;
			}
			content = flat[0];
		}
		if (content === null || content === undefined) {
			const node = document.createComment("g");
			setBoundary(node, node);
		} else if (content instanceof Node) {
			setBoundary(content, content);
		} else if (content instanceof View) {
			setBoundary(content.first, content.last);
			content.setBoundaryOwner(setBoundary);
		} else {
			const text = createText(content);
			setBoundary(text, text);
		}
	});
}
function mount(parent, content) {
	const view = render(content);
	parent.appendChild(view.take());
	teardown(() => {
		view.detach();
	});
	return view;
}

const HTML = "http://www.w3.org/1999/xhtml";
const SVG = "http://www.w3.org/2000/svg";
const MATHML = "http://www.w3.org/1998/Math/MathML";
const XMLNS = Symbol.for("gluon:namespace");
function appendContent(node, content) {
	if (content === null || content === undefined) {
		return;
	}
	if (Array.isArray(content)) {
		for (let i = 0; i < content.length; i++) {
			appendContent(node, content[i]);
		}
	} else if (content instanceof Node) {
		node.appendChild(content);
	} else if (content instanceof View) {
		node.appendChild(content.take());
	} else {
		node.appendChild(createText(content));
	}
}
function setAttr(elem, name, value) {
	if (value === null || value === undefined || value === false) {
		elem.removeAttribute(name);
	} else {
		elem.setAttribute(name, value === true ? "" : value);
	}
}
function getClassTokens(value) {
	value = get(value);
	if (typeof value === "string") {
		return value;
	} else if (value) {
		let tokens = "";
		if (Array.isArray(value)) {
			for (let i = 0; i < value.length; i++) {
				tokens += getClassTokens(value[i]) + " ";
			}
		} else {
			for (const key in value) {
				if (get(value[key])) {
					tokens += key + " ";
				}
			}
		}
		return tokens;
	}
	return "";
}
function watchStyle(value, handler) {
	watch(value, value => {
		if (Array.isArray(value)) {
			const overwrites = [];
			for (let i = value.length - 1; i >= 0; i--) {
				const self = [];
				overwrites[i] = self;
				watchStyle(value[i], (name, value) => {
					if (!self.includes(name)) {
						self.push(name);
					}
					for (let o = i + 1; o < overwrites.length; o++) {
						if (overwrites[o].includes(name)) {
							return;
						}
					}
					handler(name, value);
				});
			}
		} else if (value) {
			for (const name in value) {
				watch(value[name], value => handler(name, value));
			}
		}
	});
}
function setAttributes(elem, attrs) {
	attrs: for (const name in attrs) {
		const value = attrs[name];
		if (value === undefined) {
			continue attrs;
		}
		if (name.startsWith("$")) {
			const capture = name.startsWith("$$");
			const event = name.slice(capture ? 2 : 1);
			elem.addEventListener(event, wrapContext(value), { capture });
		} else if (name.startsWith("prop:")) {
			const prop = name.slice(5);
			watch(value, value => (elem[prop] = value));
		} else if (name.startsWith("attr:")) {
			const attr = name.slice(5);
			watch(value, value => setAttr(elem, attr, value));
		} else {
			switch (name) {
				case "style": {
					const style = elem.style;
					watchStyle(value, (name, value) => {
						style.setProperty(name, value ? String(value) : null);
					});
					continue attrs;
				}
				case "class": {
					watch(
						() => getClassTokens(value),
						tokens => {
							elem.setAttribute("class", tokens);
						},
					);
					continue attrs;
				}
			}
			watch(value, value => setAttr(elem, name, value));
		}
	}
}
function createElement(tagName, attrs, content) {
	const ns = extract(XMLNS);
	const elem = ns === undefined ? document.createElement(tagName) : document.createElementNS(ns, tagName);
	setAttributes(elem, attrs);
	appendContent(elem, content);
	return elem;
}
function e(tagName, attrs, content) {
	if (Array.isArray(attrs)) {
		return createElement(tagName, {}, attrs);
	}
	return createElement(tagName, attrs ?? {}, content ?? []);
}

const { NEXT_ID } = GLOBALS;
function uniqueId() {
	return "gluon_" + String(NEXT_ID.value++);
}
function useUniqueId(fn) {
	return fn(uniqueId());
}

function useAbortController(reason) {
	const controller = new AbortController();
	teardown(() => controller.abort(reason));
	return controller;
}
function useAbortSignal(reason) {
	return useAbortController(reason).signal;
}

class AsyncContext {
	#parent;
	#tasks = sig(new Set());
	#errorHandlers = new Set();
	constructor(parent) {
		this.#parent = parent;
	}
	get pending() {
		return this.#tasks.value.size > 0;
	}
	track(task) {
		this.#parent?.track(task);
		this.#tasks.update(tasks => {
			tasks.add(task);
		});
		task.then(
			() => {
				this.#tasks.update(tasks => {
					tasks.delete(task);
				});
			},
			error => {
				if (this.#errorHandlers.size > 0) {
					for (const errorHandler of this.#errorHandlers) {
						errorHandler.push(error);
					}
				} else {
					void Promise.reject(error);
				}
				this.#tasks.update(tasks => {
					tasks.delete(task);
				});
			},
		);
	}
	async complete() {
		const errors = [];
		this.#errorHandlers.add(errors);
		while (this.#tasks.value.size > 0) {
			await Promise.allSettled(this.#tasks.value);
		}
		this.#errorHandlers.delete(errors);
		if (errors.length === 1) {
			throw errors[0];
		} else if (errors.length > 1) {
			throw new AsyncError(errors);
		}
	}
	static fork() {
		return new AsyncContext(extract(ASYNC));
	}
}
class AsyncError extends Error {
	errors;
	constructor(errors) {
		super();
		this.errors = errors;
	}
}
const ASYNC = Symbol.for("gluon:async");

function async(options) {
	const { source, pending, resolved, rejected } = options;
	const state = sig({ type: "pending", value: undefined });
	let promise;
	if (typeof source === "function") {
		promise = (async () => source())();
	} else {
		promise = source;
	}
	const ac = extract(ASYNC);
	promise.then(
		value => {
			state.value = { type: "resolved", value };
		},
		value => {
			state.value = { type: "rejected", value };
			if (ac === undefined && rejected === undefined) {
				void Promise.reject(value);
			}
		},
	);
	ac?.track(promise);
	return nest(() => {
		switch (state.value.type) {
			case "pending":
				return pending;
			case "resolved": {
				const { value } = state.value;
				return resolved ? () => resolved(value) : undefined;
			}
			case "rejected": {
				const { value } = state.value;
				return rejected ? () => rejected(value) : undefined;
			}
		}
	});
}

class TaskSlot {
	#queue = [];
	#blocked = -1;
	#controller = undefined;
	#running = undefined;
	constructor() {
		teardown(() => this.#abort());
	}
	#abort() {
		const queue = this.#queue;
		while (queue.length > 0 && !queue[0].blocking) {
			queue.shift();
			this.#blocked--;
		}
		this.#controller?.abort();
	}
	#run() {
		if (this.#running === undefined) {
			this.#running = (async () => {
				let task;
				while ((task = this.#queue.shift())) {
					this.#blocked--;
					if (task.blocking) {
						try {
							task.resolve(await task.task());
						} catch (error) {
							task.reject(error);
						}
					} else {
						const controller = new AbortController();
						this.#controller = controller;
						try {
							await task.task(controller.signal);
						} catch (error) {
							void Promise.reject(error);
						}
						this.#controller = undefined;
					}
				}
				this.#running = undefined;
			})();
		}
	}
	sideEffect(task) {
		if (this.#blocked >= 0) {
			return;
		}
		this.#abort();
		this.#queue.push({ blocking: false, task, resolve: undefined, reject: undefined });
		this.#run();
	}
	block(task) {
		return new Promise((resolve, reject) => {
			this.#abort();
			this.#blocked = this.#queue.push({ blocking: true, task, resolve, reject });
			this.#run();
		});
	}
}

class Tasks {
	#pendingCount = 0;
	#pending = sig(false);
	#restoreFocus;
	#parent;
	constructor(parent, options) {
		this.#parent = parent;
		this.#restoreFocus = options?.restoreFocus ?? (parent ? parent.#restoreFocus : true);
		if (this.#restoreFocus) {
			let last = null;
			watch(this.#pending, pending => {
				if (pending) {
					last = document.activeElement;
				} else if (last && document.activeElement === document.body) {
					const target = last;
					queueMicrotask(() => {
						if (last === target && document.activeElement === document.body) {
							target.focus?.();
						}
					});
				}
			});
		}
	}
	#setPending() {
		this.#pendingCount++;
		this.#pending.value = true;
	}
	#unsetPending() {
		this.#pendingCount--;
		this.#pending.value = this.#pendingCount > 0;
	}
	get parent() {
		return this.#parent;
	}
	get selfPending() {
		return this.#pending.value;
	}
	get pending() {
		return (this.#parent?.pending ?? false) || this.#pending.value;
	}
	setPending() {
		this.#setPending();
		let disposed = false;
		teardown(() => {
			if (!disposed) {
				disposed = true;
				this.#unsetPending();
			}
		});
	}
	waitFor(source) {
		if (typeof source === "function") {
			this.#setPending();
			void (async () => {
				try {
					return await source();
				} catch (error) {
					void Promise.reject(error);
				}
				this.#unsetPending();
			})();
		} else if (source instanceof Promise) {
			this.#setPending();
			void source.then(
				() => {
					this.#unsetPending();
				},
				() => {
					this.#unsetPending();
				},
			);
		}
	}
	static fork(options) {
		return new Tasks(extract(TASKS), options);
	}
}
const TASKS = Symbol.for("gluon:tasks");
function isSelfPending() {
	return extract(TASKS)?.selfPending ?? false;
}
function isPending() {
	return extract(TASKS)?.pending ?? false;
}
function setPending() {
	extract(TASKS)?.setPending();
}
function waitFor(source) {
	extract(TASKS)?.waitFor(source);
}

class WaitForTimeoutError extends Error {}
function watchFor(expr, condition, timeout) {
	if (typeof condition === "number") {
		timeout = condition;
		condition = Boolean;
	} else if (condition === undefined) {
		condition = Boolean;
	}
	return new Promise((resolve, reject) => {
		captureSelf(dispose => {
			watch(expr, value => {
				if (condition(value)) {
					dispose();
					resolve(value);
				}
			});
			if (timeout !== undefined) {
				const handle = setTimeout(() => {
					dispose();
					reject(new WaitForTimeoutError());
				}, timeout);
				teardown(() => clearTimeout(handle));
			}
		});
	});
}

function normalize(path, preserveDir = true) {
	if (path === "/" || path === "") {
		return "";
	}
	if (!preserveDir && path.endsWith("/")) {
		path = path.slice(0, path.length - 1);
	}
	if (path.startsWith("/")) {
		return path;
	}
	return "/" + path;
}
function join(parent, child, preserveDir = true) {
	parent = normalize(parent);
	if (parent.endsWith("/")) {
		parent = parent.slice(0, -1);
	}
	return parent + normalize(child, preserveDir);
}

class ChildRouter {
	#parent;
	#mountPath;
	#path;
	constructor(parent, mountPath, path) {
		this.#parent = parent;
		this.#mountPath = mountPath;
		this.#path = path;
	}
	get root() {
		return this.#parent.root;
	}
	get parent() {
		return this.#parent;
	}
	get path() {
		return get(this.#path);
	}
	get query() {
		return this.#parent.query;
	}
	push(path, query) {
		this.#parent.push(join(this.#mountPath, path), query);
	}
	replace(path, query) {
		this.#parent.replace(join(this.#mountPath, path), query);
	}
}

class HashRouter {
	#path = sig(undefined);
	#query = sig(undefined);
	constructor(options) {
		const parseEvents = options?.parseEvents ?? ["popstate", "gluon:router:update"];
		for (const name of parseEvents) {
			window.addEventListener(name, this.#parse, { passive: true });
			teardown(() => window.removeEventListener(name, this.#parse));
		}
		this.#parse();
	}
	#parse = () => {
		batch(() => {
			const hash = location.hash.slice(1);
			const queryStart = hash.indexOf("?");
			if (queryStart < 0) {
				this.#path.value = normalize(hash);
				this.#query.value = undefined;
			} else {
				this.#path.value = normalize(hash.slice(0, queryStart));
				this.#query.value = new URLSearchParams(hash.slice(queryStart + 1));
			}
		});
	};
	get root() {
		return this;
	}
	get parent() {
		return undefined;
	}
	get path() {
		return this.#path.value;
	}
	get query() {
		return this.#query.value;
	}
	push(path, query) {
		location.hash = `#${normalize(path)}${query === undefined ? "" : new URLSearchParams(query)}`;
	}
	replace(path, query) {
		this.push(path, query);
	}
}

class HistoryRouter {
	#path = sig(undefined);
	#query = sig(undefined);
	constructor(options) {
		const parseEvents = options?.parseEvents ?? ["popstate", "gluon:router:update"];
		for (const name of parseEvents) {
			window.addEventListener(name, this.#parse, { passive: true });
			teardown(() => window.removeEventListener(name, this.#parse));
		}
		this.#parse();
	}
	#parse = () => {
		batch(() => {
			this.#path.value = normalize(location.pathname);
			const query = location.search.slice(1);
			this.#query.value = query ? new URLSearchParams(query) : undefined;
		});
	};
	get root() {
		return this;
	}
	get parent() {
		return undefined;
	}
	get path() {
		return this.#path.value;
	}
	get query() {
		return this.#query.value;
	}
	push(path, query) {
		history.pushState(null, "", formatPath(path, query));
		window.dispatchEvent(new CustomEvent("gluon:router:update"));
	}
	replace(path, query) {
		history.replaceState(null, "", formatPath(path, query));
		window.dispatchEvent(new CustomEvent("gluon:router:update"));
	}
}
function formatPath(path, query) {
	return `${path || "/"}${query === undefined ? "" : new URLSearchParams(query)}`;
}

const ROUTER = Symbol.for("gluon:router");

function matchRoute(path, routes) {
	for (let i = 0; i < routes.length; i++) {
		const route = routes[i];
		if (typeof route.path === "string") {
			const test = route.path === "/" ? "" : route.path;
			if (test.endsWith("/")) {
				if (path.startsWith(test) || path === test.slice(0, -1)) {
					return {
						route,
						path: normalize(path.slice(0, test.length - 1)),
						params: undefined,
						rest: normalize(path.slice(test.length)),
					};
				}
			} else if (test === path) {
				return {
					route,
					path,
					params: undefined,
					rest: "",
				};
			}
		} else if (typeof route.path === "function") {
			const match = route.path(path);
			if (match !== undefined) {
				let matched;
				let params;
				if (Array.isArray(match)) {
					matched = normalize(match[0]);
					params = match[1];
				} else {
					matched = normalize(match);
					params = undefined;
				}
				let rest = path;
				if (path.startsWith(matched) && (path.length === matched.length || path[matched.length] === "/")) {
					rest = normalize(path.slice(matched.length));
				}
				return {
					route,
					path: matched,
					params,
					rest,
				};
			}
		} else if (route.path instanceof RegExp) {
			const match = route.path.exec(path);
			if (match !== null) {
				const matched = normalize(match[0], false);
				let rest = path;
				if (path.startsWith(matched) && (path.length === matched.length || path[matched.length] === "/")) {
					rest = normalize(path.slice(matched.length));
				}
				return {
					route,
					path: matched,
					params: match,
					rest,
				};
			}
		} else if (route.path === undefined) {
			return {
				route,
				path: "",
				params: undefined,
				rest: path,
			};
		} else {
			throw new Error("invalid path");
		}
	}
}
class WatchedRoutes {
	#match;
	#rest;
	constructor(match, rest) {
		this.#match = match;
		this.#rest = rest;
	}
	get match() {
		return this.#match.value;
	}
	get rest() {
		return this.#rest.value;
	}
}
function watchRoutes(path, routes) {
	const parent = sig(undefined);
	const rest = sig(undefined);
	watch(
		() => matchRoute(get(path), routes),
		match => {
			if (match) {
				if (!parent.value || parent.value.path !== match.path || parent.value.route !== match.route) {
					parent.value = match;
				}
				rest.value = match.rest;
			} else {
				parent.value = undefined;
				rest.value = "";
			}
		},
		false,
	);
	return new WatchedRoutes(parent, rest);
}
function routes(routes) {
	const router = extract(ROUTER);
	if (!router) {
		throw new Error("router not available");
	}
	const watched = watchRoutes(() => router.path, routes);
	return nest(() => {
		const match = watched.match;
		if (match) {
			return () =>
				inject(ROUTER, new ChildRouter(router, match.path, () => watched.rest), () => {
					return match.route.content(match.params);
				});
		}
	});
}

export {
	ASYNC,
	AsyncContext,
	AsyncError,
	ChildRouter,
	HTML,
	HashRouter,
	HistoryRouter,
	MATHML,
	MovableView,
	ROUTER,
	SVG,
	Signal,
	TASKS,
	TaskSlot,
	Tasks,
	View,
	WaitForTimeoutError,
	WatchedRoutes,
	XMLNS,
	appendContent,
	async,
	batch,
	capture,
	captureSelf,
	createElement,
	createText,
	deriveContext,
	e,
	extract,
	formatPath,
	get,
	getContext,
	inject,
	isPending,
	isSelfPending,
	iter,
	iterUnique,
	join,
	lazy,
	map,
	matchRoute,
	memo,
	mount,
	movable,
	nest,
	normalize,
	optionalString,
	render,
	routes,
	runInContext,
	setAttributes,
	setPending,
	show,
	sig,
	string,
	teardown,
	track,
	trigger,
	uncapture,
	uniqueId,
	untrack,
	useAbortController,
	useAbortSignal,
	useUniqueId,
	viewNodes,
	waitFor,
	watch,
	watchFor,
	watchRoutes,
	when,
	wrapContext,
};
